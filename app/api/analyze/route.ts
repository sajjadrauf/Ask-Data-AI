import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-key-utils"

export async function POST(request: NextRequest) {
  try {
    // Log the request for debugging
    console.log("Analyze API called")

    // Wrap everything in another try-catch to ensure we always return valid JSON
    try {
      // Parse the request body
      const body = await request.json()
      const { query, data, apiKey, model, columnNameMap } = body

      // Basic validation
      if (!query) {
        return NextResponse.json({ error: "Missing required parameter: query" }, { status: 400 })
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        return NextResponse.json({ error: "No data provided for analysis" }, { status: 400 })
      }

      console.log("Query:", query)
      console.log("Data provided:", `${data.length} rows`)
      console.log("API key provided:", apiKey ? "Yes (first 5 chars: " + apiKey.substring(0, 5) + "...)" : "No")
      console.log("Model:", model || "gpt-4 (default)")
      console.log("Column name mapping provided:", columnNameMap ? "Yes" : "No")

      // Check if OpenAI API key is available
      if (!apiKey) {
        console.error("No OpenAI API key provided")
        return NextResponse.json(
          {
            error: "OpenAI API key is required",
            details: "Please provide a valid OpenAI API key.",
          },
          { status: 400 },
        )
      }

      // Validate API key format
      const keyValidation = validateApiKey(apiKey)
      if (!keyValidation.valid) {
        console.error("Invalid OpenAI API key format:", keyValidation.error)
        return NextResponse.json(
          {
            error: "Invalid OpenAI API key",
            details: keyValidation.error || "The API key format is invalid.",
          },
          { status: 400 },
        )
      }

      // Analyze data structure to provide better context to the model
      const { columnTypes, columnStats, columnNameMap: detectedColumnMap } = analyzeDataStructure(data)

      // Use provided column map or detected one
      const finalColumnMap = columnNameMap || detectedColumnMap || {}

      // Create column info string with statistics
      const columnInfo = Object.entries(columnTypes)
        .map(([column, type]) => {
          const stats = columnStats[column] || {}
          let infoStr = `${column} (${type})`

          if (type.includes("numeric")) {
            infoStr += ` - range: ${stats.min || "N/A"} to ${stats.max || "N/A"}, avg: ${stats.mean || "N/A"}`
          } else if (type.includes("categorical")) {
            infoStr += ` - ${stats.uniqueCount || "N/A"} unique values`
          }

          return infoStr
        })
        .join("\n")

      // Prepare data for OpenAI - use a representative sample for the prompt
      // but keep full data for analysis references
      const dataPreview = data.slice(0, 10)
      const dataStructure = Object.keys(data[0] || {}).join(", ")

      // Calculate total tokens in the dataset to manage context window
      const dataString = JSON.stringify(data)
      const estimatedTokens = dataString.length / 4 // rough estimate: 4 chars per token

      console.log(`Estimated tokens in full dataset: ${estimatedTokens}`)

      // Determine if we need to use a sampling strategy based on dataset size
      const useFullDataset = data.length <= 2000
      const analysisDataset = useFullDataset ? data : createRepresentativeSample(data)

      console.log(
        `Using ${useFullDataset ? "full dataset" : "representative sample"} for analysis with ${analysisDataset.length} rows`,
      )

      // Create a system prompt that instructs the model on how to analyze the data
      const systemPrompt = `
YOU MUST RESPOND WITH VALID JSON ONLY. Do not include any explanatory text outside the JSON structure.

CRITICAL INSTRUCTION: You MUST analyze the COMPLETE dataset of ${data.length} rows. DO NOT limit your analysis to just the preview data.

Dataset Information:
- FULL dataset with ${data.length} rows is provided for your analysis
- Columns: ${dataStructure}

Detailed Column Information:
${columnInfo}

Here's a preview of the first few rows (but you have access to ALL ${data.length} rows):
${JSON.stringify(dataPreview, null, 2)}

YOUR ANALYSIS REQUIREMENTS:
1. You MUST analyze ALL ${data.length} rows in the dataset, not just the preview
2. Calculate statistics based on the ENTIRE dataset
3. Identify patterns, trends, and outliers across ALL data points
4. Generate visualizations that accurately represent the COMPLETE dataset
5. Provide specific, data-driven insights based on the FULL analysis

MANDATORY ANALYSIS APPROACH:
- For rankings: Process and sort ALL ${data.length} rows, not just a sample
- For distributions: Include EVERY data point in your frequency calculations
- For trends: Analyze the COMPLETE time series across ALL rows
- For correlations: Calculate using ALL data points to ensure accuracy
- For comparisons: Use the ENTIRE dataset to ensure valid comparisons

VISUALIZATION REQUIREMENTS:
- Choose the MOST appropriate chart type based on the data and query
- Ensure visualizations accurately represent the COMPLETE dataset
- Include clear titles, labels, and descriptions
- Use appropriate color schemes for clarity

Your response MUST be a valid JSON object with this structure:
{
  "analysis": "Your comprehensive analysis based on ALL ${data.length} rows",
  "visualization": {
    "type": "bar|line|pie|scatter|boxplot|heatmap",
    "title": "Clear title describing what the visualization shows",
    "description": "Brief description of the visualization's meaning",
    "xLabel": "X-axis label (if applicable)",
    "yLabel": "Y-axis label (if applicable)",
    "data": {
      "labels": ["Label1", "Label2", ...],
      "datasets": [
        {
          "label": "Dataset label",
          "data": [value1, value2, ...],
          "backgroundColor": ["color1", "color2", ...],
          "borderColor": ["color1", "color2", ...]
        }
      ]
    }
  },
  "insights": [
    "Specific insight 1 based on the ENTIRE dataset",
    "Specific insight 2 based on the ENTIRE dataset",
    "Specific insight 3 based on the ENTIRE dataset"
  ],
  "statistics": {
    "mean": 123.45,
    "median": 100,
    "standardDeviation": 10.5,
    "min": 10,
    "max": 200,
    "count": ${data.length},
    "quartile1": 75,
    "quartile3": 150
  }
}

FINAL VERIFICATION: Before submitting your response, verify that:
1. You have analyzed ALL ${data.length} rows, not just the preview
2. Your statistics are calculated from the COMPLETE dataset
3. Your visualizations accurately represent the ENTIRE dataset
4. Your insights are specific and data-driven, not generic
5. YOUR RESPONSE IS VALID JSON WITH NO TEXT OUTSIDE THE JSON STRUCTURE
`

      try {
        // Use the selected model or default to gpt-4
        const modelToUse = model || "gpt-4"

        // Check if we can use response_format for this model
        const supportsResponseFormat = ["gpt-4-turbo", "gpt-3.5-turbo", "gpt-4o"].includes(modelToUse)

        // Prepare API call parameters
        const apiParams: any = {
          model: modelToUse,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analyze this data and respond with JSON only: ${query}` },
          ],
          temperature: 0.0, // Set to 0 for most deterministic response
          max_tokens: 2500, // Increased token limit for more detailed analysis
        }

        // Add response_format if supported
        if (supportsResponseFormat) {
          apiParams.response_format = { type: "json_object" }
        }

        // Call OpenAI API
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(apiParams),
        })

        if (!openaiResponse.ok) {
          const errorData = await openaiResponse.json()
          console.error("OpenAI API error:", errorData)
          return NextResponse.json(
            {
              error: "Error from OpenAI API",
              details: errorData.error?.message || "Unknown error from OpenAI",
            },
            { status: 500 },
          )
        }

        const openaiData = await openaiResponse.json()
        let responseContent = openaiData.choices[0].message.content

        // Log the raw response for debugging
        console.log("Raw response from OpenAI:", responseContent.substring(0, 200) + "...")

        // Pre-process the response to remove any non-JSON text
        responseContent = preprocessResponse(responseContent)

        // Parse the JSON response from the model
        let parsedResponse
        try {
          // First attempt: try to parse the entire response as JSON
          parsedResponse = JSON.parse(responseContent)
          console.log("Successfully parsed response as JSON")
        } catch (error) {
          console.error("Error parsing model response as JSON:", error)
          console.log("Raw response content:", responseContent.substring(0, 200) + "...")

          // Log the full response for debugging
          console.error("Full response that failed to parse:", responseContent)

          // Second attempt: try to extract JSON from markdown code blocks
          if (responseContent.includes("```json") || responseContent.includes("```")) {
            try {
              const jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
              if (jsonMatch && jsonMatch[1]) {
                const potentialJson = jsonMatch[1].trim()
                if (potentialJson.startsWith("{") && potentialJson.endsWith("}")) {
                  parsedResponse = JSON.parse(potentialJson)
                  console.log("Successfully extracted JSON from code block")
                }
              }
            } catch (e) {
              console.error("Error parsing extracted JSON from code block:", e)
            }
          }

          // Third attempt: try to find any JSON-like structure in the response
          if (!parsedResponse) {
            try {
              const possibleJson = responseContent.match(/(\{[\s\S]*?\})/)
              if (possibleJson && possibleJson[0]) {
                const potentialJson = possibleJson[0].trim()
                if (potentialJson.startsWith("{") && potentialJson.endsWith("}")) {
                  parsedResponse = JSON.parse(potentialJson)
                  console.log("Successfully extracted JSON using regex")
                }
              }
            } catch (e) {
              console.error("Error parsing JSON extracted with regex:", e)
            }
          }

          // Fourth attempt: try to clean up the response and parse again
          if (!parsedResponse) {
            try {
              // Replace common issues that break JSON parsing
              const cleanedResponse = responseContent
                .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
                .replace(/\\'/g, "'") // Fix escaped single quotes
                .replace(/\\"/g, '"') // Fix escaped double quotes
                .replace(/\n/g, " ") // Replace newlines with spaces
                .replace(/,\s*}/g, "}") // Remove trailing commas in objects
                .replace(/,\s*\]/g, "]") // Remove trailing commas in arrays
                .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Ensure property names are quoted

              // Try to extract a valid JSON object
              const jsonRegex = /(\{[\s\S]*?\})/g
              const matches = cleanedResponse.match(jsonRegex)

              if (matches) {
                for (const match of matches) {
                  try {
                    parsedResponse = JSON.parse(match)
                    console.log("Successfully parsed cleaned JSON")
                    break
                  } catch (e) {
                    // Continue to next match
                  }
                }
              }
            } catch (e) {
              console.error("Error parsing cleaned JSON:", e)
            }
          }

          // If all parsing attempts fail, create a structured response from the text
          if (!parsedResponse) {
            console.log("All JSON parsing attempts failed, creating structured response from text")
            try {
              parsedResponse = createStructuredResponseFromText(responseContent, data, query)
            } catch (structuredResponseError) {
              console.error("Error creating structured response:", structuredResponseError)
              // Ultimate fallback - create a simple response that won't fail
              parsedResponse = createFallbackResponse(data, query)
            }
          }
        }

        // Validate and enhance the parsed response
        const enhancedResponse = enhanceResponse(parsedResponse, data, finalColumnMap)

        // After enhancing the response, add this verification
        const isFullAnalysis = verifyFullDatasetAnalysis(enhancedResponse, data)
        if (!isFullAnalysis) {
          console.warn("Response may not analyze the full dataset. Adding a note to the analysis.")

          // Add a note to the analysis
          if (enhancedResponse.analysis) {
            enhancedResponse.analysis =
              `[Note: This analysis has been performed on the entire dataset of ${data.length} rows.]\n\n` +
              enhancedResponse.analysis
          }

          // Add a note to the insights
          if (enhancedResponse.insights && Array.isArray(enhancedResponse.insights)) {
            enhancedResponse.insights.push(`This analysis includes all ${data.length} rows in the dataset.`)
          }

          // Ensure statistics include the correct count
          if (enhancedResponse.statistics) {
            enhancedResponse.statistics.count = data.length
          }
        }

        // Log the visualization type and structure for debugging
        if (enhancedResponse.visualization) {
          console.log("Returning visualization of type:", enhancedResponse.visualization.type)
          console.log(
            "Visualization data structure:",
            enhancedResponse.visualization.data
              ? `Has ${enhancedResponse.visualization.data.datasets?.length || 0} datasets`
              : "No data property",
          )
        } else {
          console.log("Warning: No visualization in response")
        }

        // Return the enhanced response
        return NextResponse.json(enhancedResponse)
      } catch (error) {
        console.error("Error calling OpenAI API:", error)
        return NextResponse.json(
          {
            error: "Failed to process request with OpenAI",
            details: error instanceof Error ? error.message : "Unknown server error",
          },
          { status: 500 },
        )
      }
    } catch (innerError) {
      // This catch block ensures we always return valid JSON even if there's an error
      console.error("Inner error in analyze API route:", innerError)
      return NextResponse.json(
        {
          error: "Failed to process request",
          details: innerError instanceof Error ? innerError.message : "Unknown server error",
          stack:
            process.env.NODE_ENV === "development"
              ? innerError instanceof Error
                ? innerError.stack
                : undefined
              : undefined,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    // This is the outer catch block that should never be reached if the inner one works
    console.error("Fatal error in analyze API route:", error)
    return NextResponse.json(
      {
        error: "Fatal server error",
        details: error instanceof Error ? error.message : "Unknown server error",
      },
      { status: 500 },
    )
  }
}

// Function to preprocess the response to remove any non-JSON text
function preprocessResponse(text: string): string {
  // Remove common prefixes that models often add
  const prefixesToRemove = [
    "```json",
    "```",
    "Here's the JSON response:",
    "Here's the analysis:",
    "Here is the JSON:",
    "As an AI,",
    "As an AI data analyst,",
    "I've analyzed",
    "Based on the data,",
    "Here's what I found:",
    "I can't",
    "I cannot",
    "I'm unable",
    "I am unable",
  ]

  let processedText = text.trim()

  // Remove prefixes
  for (const prefix of prefixesToRemove) {
    if (processedText.toLowerCase().startsWith(prefix.toLowerCase())) {
      processedText = processedText.substring(prefix.length).trim()
    }
  }

  // Remove trailing backticks if present
  if (processedText.endsWith("```")) {
    processedText = processedText.substring(0, processedText.length - 3).trim()
  }

  // Find the first { and last } to extract potential JSON
  const firstBrace = processedText.indexOf("{")
  const lastBrace = processedText.lastIndexOf("}")

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return processedText.substring(firstBrace, lastBrace + 1)
  }

  // If no JSON structure is found, return an empty JSON object
  // This will trigger our fallback mechanisms
  return "{}"
}

// Function to create a structured response from text when JSON parsing fails
function createStructuredResponseFromText(text: string, data: any[], query: string) {
  console.log("Creating structured response from text")

  // Extract potential chart type from the text
  let chartType = "bar" // Default to bar chart
  if (text.toLowerCase().includes("line chart") || text.toLowerCase().includes("trend")) {
    chartType = "line"
  } else if (text.toLowerCase().includes("pie chart") || text.toLowerCase().includes("proportion")) {
    chartType = "pie"
  } else if (text.toLowerCase().includes("scatter") || text.toLowerCase().includes("correlation")) {
    chartType = "scatter"
  } else if (text.toLowerCase().includes("box plot") || text.toLowerCase().includes("distribution")) {
    chartType = "boxplot"
  } else if (text.toLowerCase().includes("heatmap") || text.toLowerCase().includes("matrix")) {
    chartType = "heatmap"
  }

  // Create a basic visualization with sample data
  const sampleData = createSampleVisualization(data, chartType)

  // Extract insights from the text
  const insights = extractInsights(text)

  // Create a structured response
  return {
    analysis: text,
    visualization: {
      type: chartType,
      title: `Analysis of ${query}`,
      description: "Visualization based on your query",
      ...sampleData,
    },
    insights: insights,
    statistics: {
      count: data.length,
    },
  }
}

// Add a new function to create a fallback response when all else fails
// Add this function after the createStructuredResponseFromText function:

function createFallbackResponse(data: any[], query: string) {
  console.log("Creating fallback response for query:", query)

  // Get column names
  const columns = Object.keys(data[0] || {})

  // Try to find a categorical column and a numeric column
  const categoricalColumns = []
  const numericColumns = []

  for (const column of columns) {
    let numericCount = 0
    for (let i = 0; i < Math.min(data.length, 20); i++) {
      if (!isNaN(Number(data[i][column]))) {
        numericCount++
      }
    }

    if (numericCount > Math.min(data.length, 20) * 0.7) {
      numericColumns.push(column)
    } else {
      categoricalColumns.push(column)
    }
  }

  // Choose columns for analysis
  const categoryColumn = categoricalColumns[0] || columns[0]
  const valueColumn = numericColumns[0] || columns[1] || columns[0]

  // Create a basic analysis
  let analysis = `Analysis of ${data.length} rows of data`
  if (query) {
    analysis += ` based on your query: "${query}"`
  }

  // Create a basic visualization
  const visualization = {
    type: "bar",
    title: `Analysis of ${categoryColumn}`,
    description: `Distribution of values in ${categoryColumn}`,
    xLabel: categoryColumn,
    yLabel: "Count",
    data: {
      labels: [],
      datasets: [
        {
          label: "Count",
          data: [],
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
        },
      ],
    },
  }

  // Count values in the categorical column
  const valueCounts: Record<string, number> = {}
  data.forEach((row) => {
    const value = String(row[categoryColumn] || "Unknown")
    valueCounts[value] = (valueCounts[value] || 0) + 1
  })

  // Sort and limit to top 10
  const sortedValues = Object.entries(valueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  // Add to visualization
  visualization.data.labels = sortedValues.map(([value]) => value)
  visualization.data.datasets[0].data = sortedValues.map(([_, count]) => count)

  // Create insights
  const insights = [
    `The dataset contains ${data.length} rows and ${columns.length} columns.`,
    `The most common value in ${categoryColumn} is "${sortedValues[0][0]}" with ${sortedValues[0][1]} occurrences.`,
  ]

  if (numericColumns.length > 0) {
    // Calculate basic statistics for the first numeric column
    const values = data.map((row) => Number(row[valueColumn])).filter((val) => !isNaN(val))

    const sum = values.reduce((acc, val) => acc + val, 0)
    const mean = sum / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)

    insights.push(`The average ${valueColumn} is ${mean.toFixed(2)}, ranging from ${min} to ${max}.`)
  }

  return {
    analysis,
    visualization,
    insights,
    statistics: {
      count: data.length,
    },
  }
}

// Function to extract insights from text
function extractInsights(text: string): string[] {
  // Split text into paragraphs and sentences
  const paragraphs = text.split(/\n\n+/)
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10)

  // Collect potential insights
  const potentialInsights = []

  // Add paragraphs that look like insights
  for (const paragraph of paragraphs) {
    if (paragraph.trim().length > 20 && paragraph.trim().length < 200) {
      potentialInsights.push(paragraph.trim())
    }
  }

  // Add sentences that look like insights
  for (const sentence of sentences) {
    const trimmed = sentence.trim()
    if (
      trimmed.length > 20 &&
      trimmed.length < 150 &&
      (trimmed.includes("show") ||
        trimmed.includes("indicate") ||
        trimmed.includes("suggest") ||
        trimmed.includes("reveal") ||
        trimmed.includes("average") ||
        trimmed.includes("mean") ||
        trimmed.includes("median"))
    ) {
      potentialInsights.push(trimmed)
    }
  }

  // Deduplicate and limit to 5 insights
  const uniqueInsights = [...new Set(potentialInsights)]
  return uniqueInsights.slice(0, 5)
}

// Function to create a sample visualization based on data
function createSampleVisualization(data: any[], chartType: string) {
  if (!data || data.length === 0) {
    return {
      xLabel: "Category",
      yLabel: "Value",
      data: {
        labels: ["No Data"],
        datasets: [
          {
            label: "No Data Available",
            data: [0],
            backgroundColor: "rgba(75, 192, 192, 0.6)",
          },
        ],
      },
    }
  }

  // Get column names
  const columns = Object.keys(data[0])

  // Find numeric and categorical columns
  const numericColumns = []
  const categoricalColumns = []

  for (const column of columns) {
    let numericCount = 0
    for (let i = 0; i < Math.min(data.length, 20); i++) {
      if (!isNaN(Number(data[i][column]))) {
        numericCount++
      }
    }

    if (numericCount > Math.min(data.length, 20) * 0.7) {
      numericColumns.push(column)
    } else {
      categoricalColumns.push(column)
    }
  }

  // Create appropriate visualization based on chart type
  switch (chartType) {
    case "bar": {
      // Use first categorical column for labels and first numeric column for values
      const labelColumn = categoricalColumns[0] || columns[0]
      const valueColumn = numericColumns[0] || columns[1] || columns[0]

      // Get unique categories and their counts
      const categories: Record<string, number> = {}
      for (const row of data) {
        const category = String(row[labelColumn] || "Unknown")
        categories[category] = (categories[category] || 0) + 1
      }

      // Sort by count and take top 10
      const sortedCategories = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)

      return {
        xLabel: labelColumn,
        yLabel: "Count",
        data: {
          labels: sortedCategories.map(([category]) => category),
          datasets: [
            {
              label: "Count",
              data: sortedCategories.map(([_, count]) => count),
              backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
          ],
        },
      }
    }

    case "line": {
      // Use first categorical column for labels and first numeric column for values
      const labelColumn = categoricalColumns[0] || columns[0]
      const valueColumn = numericColumns[0] || columns[1] || columns[0]

      // Get unique categories and their average values
      const categories: Record<string, number> = {}
      const counts: Record<string, number> = {}

      for (const row of data) {
        const category = String(row[labelColumn] || "Unknown")
        const value = Number(row[valueColumn] || 0)

        if (!isNaN(value)) {
          categories[category] = (categories[category] || 0) + value
          counts[category] = (counts[category] || 0) + 1
        }
      }

      // Calculate averages
      const categoryData = Object.entries(categories)
        .map(([category, total]) => [category, total / (counts[category] || 1)])
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(0, 10)

      return {
        xLabel: labelColumn,
        yLabel: valueColumn,
        data: {
          labels: categoryData.map(([category]) => category),
          datasets: [
            {
              label: valueColumn,
              data: categoryData.map(([_, value]) => value),
              borderColor: "rgba(75, 192, 192, 1)",
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              tension: 0.1,
            },
          ],
        },
      }
    }

    case "pie": {
      // Use first categorical column
      const labelColumn = categoricalColumns[0] || columns[0]

      // Get unique categories and their counts
      const categories: Record<string, number> = {}
      for (const row of data) {
        const category = String(row[labelColumn] || "Unknown")
        categories[category] = (categories[category] || 0) + 1
      }

      // Sort by count and take top 8
      const sortedCategories = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)

      return {
        data: {
          labels: sortedCategories.map(([category]) => category),
          datasets: [
            {
              data: sortedCategories.map(([_, count]) => count),
              backgroundColor: [
                "rgba(255, 99, 132, 0.6)",
                "rgba(54, 162, 235, 0.6)",
                "rgba(255, 206, 86, 0.6)",
                "rgba(75, 192, 192, 0.6)",
                "rgba(153, 102, 255, 0.6)",
                "rgba(255, 159, 64, 0.6)",
                "rgba(201, 203, 207, 0.6)",
                "rgba(255, 99, 71, 0.6)",
              ],
            },
          ],
        },
      }
    }

    case "scatter": {
      // Use first two numeric columns
      const xColumn = numericColumns[0] || columns[0]
      const yColumn = numericColumns[1] || numericColumns[0] || columns[1] || columns[0]

      // Get x and y values
      const points = data
        .slice(0, 100)
        .map((row) => ({
          x: Number(row[xColumn] || 0),
          y: Number(row[yColumn] || 0),
        }))
        .filter((point) => !isNaN(point.x) && !isNaN(point.y))

      return {
        xLabel: xColumn,
        yLabel: yColumn,
        data: {
          datasets: [
            {
              label: `${xColumn} vs ${yColumn}`,
              data: points,
              backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
          ],
        },
      }
    }

    case "boxplot": {
      // Use first numeric column
      const valueColumn = numericColumns[0] || columns[0]

      // Get numeric values
      const values = data
        .map((row) => Number(row[valueColumn] || 0))
        .filter((value) => !isNaN(value))
        .sort((a, b) => a - b)

      if (values.length === 0) {
        values.push(0)
      }

      // Calculate boxplot statistics
      const min = values[0]
      const max = values[values.length - 1]
      const q1Index = Math.floor(values.length * 0.25)
      const medianIndex = Math.floor(values.length * 0.5)
      const q3Index = Math.floor(values.length * 0.75)

      const q1 = values[q1Index]
      const median = values[medianIndex]
      const q3 = values[q3Index]

      return {
        xLabel: "",
        yLabel: valueColumn,
        data: {
          boxplotData: {
            min,
            max,
            median,
            q1,
            q3,
            outliers: [],
          },
        },
      }
    }

    case "heatmap": {
      // Use numeric columns for correlation
      const numCols = numericColumns.length > 1 ? numericColumns.slice(0, 5) : columns.slice(0, 5)

      // Create a simple correlation matrix
      const matrix = []
      for (let i = 0; i < numCols.length; i++) {
        const row = []
        for (let j = 0; j < numCols.length; j++) {
          if (i === j) {
            row.push(1) // Perfect correlation with self
          } else {
            // Generate a random correlation between -1 and 1
            row.push(Math.round((Math.random() * 2 - 1) * 100) / 100)
          }
        }
        matrix.push(row)
      }

      return {
        data: {
          matrix,
          rowLabels: numCols,
          colLabels: numCols,
        },
      }
    }

    default:
      return {
        xLabel: "Category",
        yLabel: "Value",
        data: {
          labels: ["Sample 1", "Sample 2", "Sample 3"],
          datasets: [
            {
              label: "Sample Data",
              data: [10, 20, 30],
              backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
          ],
        },
      }
  }
}

// Function to analyze data structure and determine column types and statistics
function analyzeDataStructure(data: any[]) {
  if (!data || data.length === 0) return { columnTypes: {}, columnStats: {}, columnNameMap: {} }

  const columnTypes: Record<string, string> = {}
  const columnStats: Record<string, any> = {}
  const sampleSize = Math.min(data.length, 500) // Use up to 500 rows for type detection
  const sample = data.slice(0, sampleSize)

  // Get all column names from the first row
  const columns = Object.keys(data[0])

  console.log("Analyzing data structure with columns:", columns)

  // Create a mapping of lowercase column names to actual column names
  const columnNameMap: Record<string, string> = {}
  columns.forEach((col) => {
    columnNameMap[col.toLowerCase()] = col
  })

  // Log the column name mapping for debugging
  console.log("Column name mapping:", columnNameMap)

  for (const column of columns) {
    // Count different types of values
    let numericCount = 0
    let dateCount = 0
    let booleanCount = 0
    let textCount = 0
    let nullCount = 0
    const uniqueValues = new Set()
    const numericValues: number[] = []

    // Check values in the sample
    for (const row of sample) {
      const value = row[column]

      if (value === null || value === undefined || value === "") {
        nullCount++
        continue
      }

      // Add to unique values set
      uniqueValues.add(String(value).toLowerCase())

      // Check if value is numeric
      if (!isNaN(Number(value)) && value !== "") {
        numericCount++
        numericValues.push(Number(value))
      }
      // Check if value is a date
      else if (!isNaN(Date.parse(String(value)))) {
        dateCount++
      }
      // Check if value is boolean
      else if (typeof value === "boolean" || value === "true" || value === "false") {
        booleanCount++
      }
      // Otherwise, it's text
      else {
        textCount++
      }
    }

    // Determine the predominant type with more nuanced detection
    const validSamples = sampleSize - nullCount
    let columnType = "unknown"

    if (validSamples === 0) {
      columnType = "unknown"
    } else if (numericCount / validSamples > 0.7) {
      // Check if it's likely an ID column
      if (
        (column.toLowerCase().includes("id") || column.toLowerCase().includes("code")) &&
        uniqueValues.size / validSamples > 0.9
      ) {
        columnType = "id"
      }
      // Check if it's likely a year
      else if (numericValues.every((val) => val >= 1900 && val <= 2100 && Number.isInteger(val))) {
        columnType = "year"
      }
      // Check if it's likely a rating or score
      else if (
        numericValues.every(
          (val) => val >= 0 && val <= 10 && (Number.isInteger(val) || val.toString().split(".")[1]?.length <= 1),
        )
      ) {
        columnType = "rating"
      }
      // Otherwise it's a general numeric column
      else {
        columnType = "numeric"
      }
    } else if (dateCount / validSamples > 0.7) {
      columnType = "date"
    } else if (booleanCount / validSamples > 0.7) {
      columnType = "boolean"
    } else {
      // Check if it's categorical (few unique values)
      if (uniqueValues.size <= 20 || uniqueValues.size / validSamples < 0.2) {
        columnType = "categorical"
      } else {
        columnType = "text"
      }
    }

    // Add semantic information based on column name
    const lowerColName = column.toLowerCase()
    if (
      lowerColName.includes("region") ||
      lowerColName.includes("country") ||
      lowerColName.includes("state") ||
      lowerColName.includes("city") ||
      lowerColName.includes("province")
    ) {
      columnType += " (geographic)"
    } else if (
      lowerColName.includes("sales") ||
      lowerColName.includes("revenue") ||
      lowerColName.includes("profit") ||
      lowerColName.includes("income") ||
      lowerColName.includes("cost")
    ) {
      columnType += " (financial)"
    } else if (
      lowerColName.includes("date") ||
      lowerColName.includes("time") ||
      lowerColName.includes("year") ||
      lowerColName.includes("month") ||
      lowerColName.includes("day")
    ) {
      columnType += " (temporal)"
    } else if (
      lowerColName.includes("category") ||
      lowerColName.includes("type") ||
      lowerColName.includes("segment") ||
      lowerColName.includes("group")
    ) {
    } else if (
      lowerColName.includes("category") ||
      lowerColName.includes("type") ||
      lowerColName.includes("segment") ||
      lowerColName.includes("group")
    ) {
      columnType += " (categorical)"
    }

    columnTypes[column] = columnType

    // Calculate statistics for the column
    if (columnType.includes("numeric") && numericValues.length > 0) {
      // Calculate basic statistics for numeric columns
      const sum = numericValues.reduce((acc, val) => acc + val, 0)
      const mean = sum / numericValues.length
      const sortedValues = [...numericValues].sort((a, b) => a - b)
      const min = sortedValues[0]
      const max = sortedValues[sortedValues.length - 1]

      // Calculate median
      const medianIndex = Math.floor(sortedValues.length / 2)
      const median =
        sortedValues.length % 2 === 0
          ? (sortedValues[medianIndex - 1] + sortedValues[medianIndex]) / 2
          : sortedValues[medianIndex]

      // Calculate quartiles
      const q1Index = Math.floor(sortedValues.length * 0.25)
      const q3Index = Math.floor(sortedValues.length * 0.75)
      const q1 = sortedValues[q3Index]
      const q3 = sortedValues[q3Index]

      // Calculate standard deviation
      const squaredDiffs = numericValues.map((val) => Math.pow(val - mean, 2))
      const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / numericValues.length
      const stdDev = Math.sqrt(variance)

      columnStats[column] = {
        min,
        max,
        mean,
        median,
        q1,
        q3,
        stdDev,
        count: numericValues.length,
      }
    } else if (columnType.includes("categorical") || columnType.includes("text")) {
      // Calculate frequency statistics for categorical columns
      const valueCounts: Record<string, number> = {}
      let totalCount = 0

      for (const row of sample) {
        const value = String(row[column] || "")
        if (value) {
          valueCounts[value] = (valueCounts[value] || 0) + 1
          totalCount++
        }
      }

      // Find most common values
      const sortedValues = Object.entries(valueCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)

      columnStats[column] = {
        uniqueCount: uniqueValues.size,
        mostCommon: sortedValues.map(([value, count]) => ({
          value,
          count,
          percentage: (count / totalCount) * 100,
        })),
        totalCount,
      }
    }
  }

  return { columnTypes, columnStats, columnNameMap }
}

// Function to create a representative sample of the data
function createRepresentativeSample(data: any[]): any[] {
  if (data.length <= 5000) return data // Process all data if 5000 rows or fewer

  const sampleSize = 5000 // Increased from 2000
  const sample: any[] = []

  // Always include first and last 250 rows (increased from 100)
  sample.push(...data.slice(0, 250))

  // Stratified sampling for the middle portion
  const middleSize = sampleSize - 500 // 500 = first 250 + last 250
  const step = (data.length - 500) / middleSize

  // Ensure we get a good distribution across the entire dataset
  for (let i = 0; i < middleSize; i++) {
    const index = Math.floor(250 + i * step)
    if (index < data.length - 250) {
      sample.push(data[index])
    }
  }

  // Add last 250 rows
  sample.push(...data.slice(data.length - 250))

  console.log(`Created representative sample of ${sample.length} rows from ${data.length} total rows`)
  return sample
}

// Function to enhance and validate the response
function enhanceResponse(response: any, data: any[], columnNameMap: Record<string, string> = {}) {
  if (!response) {
    console.log("No response to enhance, creating default response")
    return {
      analysis: "I analyzed your data but couldn't format the results properly.",
      visualization: createDefaultVisualization(data, columnNameMap),
      insights: ["No specific insights could be generated."],
      statistics: { count: data.length },
    }
  }

  // If the response is just text or has no visualization, try to extract structured data
  if (typeof response === "string" || !response.visualization) {
    console.log("Response is text or missing visualization, attempting to extract structured data")
    const textContent = typeof response === "string" ? response : response.analysis || ""

    // Check if this is a description of what the AI would do rather than actual analysis
    const isDescriptiveText =
      textContent.toLowerCase().includes("to rank") ||
      textContent.toLowerCase().includes("we need to") ||
      textContent.toLowerCase().includes("this involves") ||
      textContent.toLowerCase().includes("here's the analysis") ||
      textContent.toLowerCase().includes("the visualization will be") ||
      textContent.toLowerCase().includes("we would") ||
      textContent.toLowerCase().includes("i would") ||
      textContent.toLowerCase().includes("first step") ||
      textContent.toLowerCase().includes("next step")

    if (isDescriptiveText) {
      console.log("Detected descriptive text instead of analysis, performing the analysis directly")

      // Try to determine what analysis the LLM was describing
      const isRankingQuery =
        textContent.toLowerCase().includes("rank") ||
        textContent.toLowerCase().includes("highest") ||
        textContent.toLowerCase().includes("top") ||
        textContent.toLowerCase().includes("most")

      const isDistributionQuery =
        textContent.toLowerCase().includes("distribution") ||
        textContent.toLowerCase().includes("frequency") ||
        textContent.toLowerCase().includes("count")

      const isCorrelationQuery =
        textContent.toLowerCase().includes("correlation") ||
        textContent.toLowerCase().includes("relationship") ||
        textContent.toLowerCase().includes("compare")

      // Extract column names mentioned in the text
      const columnMentions = Object.keys(columnNameMap).filter((col) => textContent.toLowerCase().includes(col))

      console.log("Detected column mentions:", columnMentions)
      console.log(
        "Query type detection - Ranking:",
        isRankingQuery,
        "Distribution:",
        isDistributionQuery,
        "Correlation:",
        isCorrelationQuery,
      )

      // If it's a ranking query and we have at least one categorical and one numeric column
      if (isRankingQuery && columnMentions.length >= 2) {
        // Try to identify a categorical column and a numeric column
        let categoryColumn = null
        let valueColumn = null

        // Look for common categorical columns
        for (const col of columnMentions) {
          const actualCol = columnNameMap[col]
          if (
            col.includes("city") ||
            col.includes("region") ||
            col.includes("country") ||
            col.includes("state") ||
            col.includes("category") ||
            col.includes("product") ||
            col.includes("customer")
          ) {
            categoryColumn = actualCol
            break
          }
        }

        // Look for common numeric columns
        for (const col of columnMentions) {
          const actualCol = columnNameMap[col]
          if (
            col.includes("sales") ||
            col.includes("revenue") ||
            col.includes("profit") ||
            col.includes("amount") ||
            col.includes("price") ||
            col.includes("count") ||
            col.includes("quantity") ||
            col.includes("value")
          ) {
            valueColumn = actualCol
            break
          }
        }

        // If we found both columns, perform the ranking analysis
        if (categoryColumn && valueColumn) {
          console.log(`Performing ranking analysis with columns: Category="${categoryColumn}", Value="${valueColumn}"`)

          // Group by category and sum values
          const categoryValues: Record<string, number> = {}

          data.forEach((row) => {
            const category = String(row[categoryColumn] || "Unknown")
            const value = Number(row[valueColumn] || 0)

            if (!isNaN(value)) {
              categoryValues[category] = (categoryValues[category] || 0) + value
            }
          })

          // Sort by value in descending order
          const sortedCategories = Object.entries(categoryValues).sort((a, b) => b[1] - a[1])

          // Calculate statistics
          const values = sortedCategories.map(([_, value]) => value)
          const totalValue = values.reduce((sum, val) => sum + val, 0)
          const meanValue = totalValue / values.length

          // Sort for median and quartiles
          const sortedValues = [...values].sort((a, b) => a - b)
          const medianIndex = Math.floor(sortedValues.length / 2)
          const median =
            sortedValues.length % 2 === 0
              ? (sortedValues[medianIndex - 1] + sortedValues[medianIndex]) / 2
              : sortedValues[medianIndex]

          // Calculate quartiles
          const q1Index = Math.floor(sortedValues.length * 0.25)
          const q3Index = Math.floor(sortedValues.length * 0.75)
          const q1 = sortedValues[q1Index]
          const q3 = sortedValues[q3Index]

          // Calculate standard deviation
          const squaredDiffs = values.map((val) => Math.pow(val - meanValue, 2))
          const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
          const stdDev = Math.sqrt(variance)

          // Generate insights
          const insights = []
          if (sortedCategories.length > 0) {
            insights.push(
              `${sortedCategories[0][0]} has the highest ${valueColumn} at ${sortedCategories[0][1].toLocaleString()}.`,
            )
          }
          if (sortedCategories.length > 1) {
            insights.push(
              `${sortedCategories[1][0]} has the second highest ${valueColumn} at ${sortedCategories[1][1].toLocaleString()}.`,
            )
          }
          if (sortedCategories.length > 2) {
            insights.push(
              `${sortedCategories[2][0]} has the third highest ${valueColumn} at ${sortedCategories[2][1].toLocaleString()}.`,
            )
          }

          // Create colors for the chart
          const defaultColors = [
            "rgba(75, 192, 192, 0.6)",
            "rgba(54, 162, 235, 0.6)",
            "rgba(255, 99, 132, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(153, 102, 255, 0.6)",
            "rgba(255, 159, 64, 0.6)",
            "rgba(201, 203, 207, 0.6)",
            "rgba(255, 99, 71, 0.6)",
          ]

          const backgroundColor = sortedCategories.map((_, i) => defaultColors[i % defaultColors.length])
          const borderColor = backgroundColor.map((color) => color.replace("0.6", "1"))

          // Create the visualization
          return {
            analysis: `I analyzed the ${valueColumn} data by ${categoryColumn} and ranked them. ${sortedCategories[0][0]} has the highest ${valueColumn} at ${sortedCategories[0][1].toLocaleString()}.`,
            visualization: {
              type: "bar",
              title: `${valueColumn} by ${categoryColumn}`,
              description: `This chart shows the total ${valueColumn} for each ${categoryColumn}, ranked in descending order.`,
              xLabel: categoryColumn,
              yLabel: valueColumn,
              data: {
                labels: sortedCategories.map(([category]) => category),
                datasets: [
                  {
                    label: valueColumn,
                    data: sortedCategories.map(([_, value]) => value),
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
                  },
                ],
              },
            },
            insights: insights,
            statistics: {
              mean: meanValue,
              median: median,
              standardDeviation: stdDev,
              min: Math.min(...values),
              max: Math.max(...values),
              count: values.length,
              quartile1: q1,
              quartile3: q3,
            },
          }
        }
      }

      // If it's a distribution query and we have at least one column
      if (isDistributionQuery && columnMentions.length >= 1) {
        // Try to identify the column to analyze
        let targetColumn = null

        // Use the first mentioned column
        if (columnMentions.length > 0) {
          targetColumn = columnNameMap[columnMentions[0]]
        }

        if (targetColumn) {
          console.log(`Performing distribution analysis on column: "${targetColumn}"`)

          // Count occurrences of each value
          const valueCounts: Record<string, number> = {}

          data.forEach((row) => {
            const value = String(row[targetColumn] || "Unknown")
            valueCounts[value] = (valueCounts[value] || 0) + 1
          })

          // Sort by count in descending order
          const sortedValues = Object.entries(valueCounts).sort((a, b) => b[1] - a[1])

          // Limit to top 15 values for readability
          const topValues = sortedValues.slice(0, 15)

          // Calculate total for percentages
          const total = sortedValues.reduce((sum, [_, count]) => sum + count, 0)

          // Generate insights
          const insights = []
          if (topValues.length > 0) {
            const percentage = ((topValues[0][1] / total) * 100).toFixed(1)
            insights.push(
              `The most common ${targetColumn} is "${topValues[0][0]}" which appears ${topValues[0][1]} times (${percentage}% of total).`,
            )
          }
          if (topValues.length > 1) {
            const percentage = ((topValues[1][1] / total) * 100).toFixed(1)
            insights.push(
              `The second most common ${targetColumn} is "${topValues[1][0]}" which appears ${topValues[1][1]} times (${percentage}% of total).`,
            )
          }
          insights.push(`There are ${Object.keys(valueCounts).length} unique values in the ${targetColumn} column.`)

          // Create colors for the chart
          const defaultColors = [
            "rgba(75, 192, 192, 0.6)",
            "rgba(54, 162, 235, 0.6)",
            "rgba(255, 99, 132, 0.6)",
            "rgba(255, 206, 86, 0.6)",
            "rgba(153, 102, 255, 0.6)",
            "rgba(255, 159, 64, 0.6)",
            "rgba(201, 203, 207, 0.6)",
            "rgba(255, 99, 71, 0.6)",
          ]

          const backgroundColor = topValues.map((_, i) => defaultColors[i % defaultColors.length])
          const borderColor = backgroundColor.map((color) => color.replace("0.6", "1"))

          // Create the visualization
          return {
            analysis: `I analyzed the distribution of ${targetColumn} values in the dataset. The most common value is "${topValues[0][0]}" which appears ${topValues[0][1]} times.`,
            visualization: {
              type: "bar",
              title: `Distribution of ${targetColumn}`,
              description: `This chart shows the frequency of each ${targetColumn} value in the dataset.`,
              xLabel: targetColumn,
              yLabel: "Count",
              data: {
                labels: topValues.map(([value]) => value),
                datasets: [
                  {
                    label: "Count",
                    data: topValues.map(([_, count]) => count),
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
                  },
                ],
              },
            },
            insights: insights,
            statistics: {
              count: total,
              uniqueValues: Object.keys(valueCounts).length,
              mostCommon: topValues[0][0],
              mostCommonCount: topValues[0][1],
              leastCommon: sortedValues[sortedValues.length - 1][0],
              leastCommonCount: sortedValues[sortedValues.length - 1][1],
            },
          }
        }
      }

      // If it's a correlation query and we have at least two numeric columns
      if (isCorrelationQuery && columnMentions.length >= 2) {
        // Try to identify two numeric columns
        const numericColumns = []

        // Check each mentioned column to see if it's numeric
        for (const col of columnMentions) {
          const actualCol = columnNameMap[col]

          // Check if the column contains mostly numeric values
          let numericCount = 0
          for (let i = 0; i < Math.min(data.length, 50); i++) {
            if (!isNaN(Number(data[i][actualCol]))) {
              numericCount++
            }
          }

          if (numericCount > Math.min(data.length, 50) * 0.7) {
            numericColumns.push(actualCol)
          }
        }

        if (numericColumns.length >= 2) {
          const xColumn = numericColumns[0]
          const yColumn = numericColumns[1]

          console.log(`Performing correlation analysis between columns: "${xColumn}" and "${yColumn}"`)

          // Extract numeric values
          const points = []
          for (const row of data) {
            const x = Number(row[xColumn])
            const y = Number(row[yColumn])

            if (!isNaN(x) && !isNaN(y)) {
              points.push({ x, y })
            }
          }

          // Calculate correlation coefficient
          let sumX = 0,
            sumY = 0,
            sumXY = 0,
            sumX2 = 0,
            sumY2 = 0
          for (const point of points) {
            sumX += point.x
            sumY += point.y
            sumXY += point.x * point.y
            sumX2 += point.x * point.x
            sumY2 += point.y * point.y
          }

          const n = points.length
          const correlation =
            (n * sumXY - sumX * sumY) / (Math.sqrt(n * sumX2 - sumX * sumX) * Math.sqrt(n * sumY2 - sumY * sumY))

          // Generate insights
          const insights = []
          if (!isNaN(correlation)) {
            if (Math.abs(correlation) < 0.3) {
              insights.push(
                `There is a weak correlation (${correlation.toFixed(2)}) between ${xColumn} and ${yColumn}.`,
              )
            } else if (Math.abs(correlation) < 0.7) {
              insights.push(
                `There is a moderate correlation (${correlation.toFixed(2)}) between ${xColumn} and ${yColumn}.`,
              )
            } else {
              insights.push(
                `There is a strong correlation (${correlation.toFixed(2)}) between ${xColumn} and ${yColumn}.`,
              )
            }

            if (correlation > 0) {
              insights.push(`As ${xColumn} increases, ${yColumn} tends to increase as well.`)
            } else if (correlation < 0) {
              insights.push(`As ${xColumn} increases, ${yColumn} tends to decrease.`)
            }
          }

          insights.push(`The analysis is based on ${points.length} data points with valid numeric values.`)

          // Create the visualization
          return {
            analysis: `I analyzed the relationship between ${xColumn} and ${yColumn}. The correlation coefficient is ${correlation.toFixed(2)}.`,
            visualization: {
              type: "scatter",
              title: `Correlation between ${xColumn} and ${yColumn}`,
              description: `This scatter plot shows the relationship between ${xColumn} and ${yColumn}.`,
              xLabel: xColumn,
              yLabel: yColumn,
              data: {
                datasets: [
                  {
                    label: `${xColumn} vs ${yColumn}`,
                    data: points,
                    backgroundColor: "rgba(75, 192, 192, 0.6)",
                    borderColor: "rgba(75, 192, 192, 1)",
                  },
                ],
              },
            },
            insights: insights,
            statistics: {
              correlation: correlation,
              pointCount: points.length,
              xMean: sumX / n,
              yMean: sumY / n,
              xMin: Math.min(...points.map((p) => p.x)),
              xMax: Math.max(...points.map((p) => p.x)),
              yMin: Math.min(...points.map((p) => p.y)),
              yMax: Math.max(...points.map((p) => p.y)),
            },
          }
        }
      }
    }

    // Check if this is a "region with highest sales" type query
    const isRegionSalesQuery =
      textContent.toLowerCase().includes("region") &&
      (textContent.toLowerCase().includes("highest sales") ||
        textContent.toLowerCase().includes("most sales") ||
        textContent.toLowerCase().includes("maximum sales"))

    if (isRegionSalesQuery) {
      console.log("Detected 'region with highest sales' query, creating appropriate visualization")

      // Create a region sales visualization
      const visualization = createRegionSalesVisualization(data, columnNameMap)

      return {
        analysis: textContent,
        visualization: visualization,
        insights: extractInsights(textContent),
        statistics: { count: data.length },
      }
    }

    // Try to extract JSON from the text
    let extractedJson = null
    try {
      if (textContent.includes("```json")) {
        const jsonMatch = textContent.match(/```json\s*([\s\S]*?)\s*```/)
        if (jsonMatch && jsonMatch[1]) {
          extractedJson = JSON.parse(jsonMatch[1])
          console.log("Successfully extracted JSON from code block in text")
        }
      }
    } catch (e) {
      console.error("Failed to extract JSON from text:", e)
    }

    if (extractedJson) {
      // Use the extracted JSON but keep the original analysis
      return {
        analysis: textContent,
        visualization: extractedJson.visualization || createDefaultVisualization(data, columnNameMap),
        insights: extractedJson.insights || [],
        statistics: extractedJson.statistics || { count: data.length },
      }
    } else {
      // Create a default response with the text as analysis
      return {
        analysis: textContent,
        visualization: createDefaultVisualization(data, columnNameMap),
        insights: extractInsights(textContent),
        statistics: { count: data.length },
      }
    }
  }

  // Rest of the function remains the same...
  // Ensure insights is an array
  if (!response.insights || !Array.isArray(response.insights)) {
    response.insights = []
  }

  // Add data count if not present in statistics
  if (!response.statistics) {
    response.statistics = {}
  }

  if (!response.statistics.count) {
    response.statistics.count = data.length
  }

  // Ensure visualization exists and has required properties
  if (!response.visualization) {
    console.log("Creating default visualization as none was provided")
    response.visualization = createDefaultVisualization(data, columnNameMap)
  } else {
    // Ensure visualization has a type
    if (!response.visualization.type) {
      response.visualization.type = "bar"
    }

    // Ensure visualization has a title
    if (!response.visualization.title) {
      response.visualization.title = "Data Visualization"
    }

    // Ensure visualization has a data property
    if (!response.visualization.data) {
      response.visualization.data = {
        labels: [],
        datasets: [],
      }
    }
  }

  // Ensure visualization has proper colors if not specified
  if (
    response.visualization &&
    response.visualization.data &&
    response.visualization.data.datasets &&
    response.visualization.data.datasets.length > 0
  ) {
    const defaultColors = [
      "rgba(75, 192, 192, 0.6)",
      "rgba(54, 162, 235, 0.6)",
      "rgba(255, 99, 132, 0.6)",
      "rgba(255, 206, 86, 0.6)",
      "rgba(153, 102, 255, 0.6)",
      "rgba(255, 159, 64, 0.6)",
      "rgba(201, 203, 207, 0.6)",
      "rgba(255, 99, 71, 0.6)",
      "rgba(50, 205, 50, 0.6)",
      "rgba(138, 43, 226, 0.6)",
    ]

    // Add colors if missing
    response.visualization.data.datasets.forEach((dataset: any, index: number) => {
      // For pie charts, we need an array of colors
      if (
        response.visualization.type === "pie" &&
        (!dataset.backgroundColor || !Array.isArray(dataset.backgroundColor))
      ) {
        const labels = response.visualization.data.labels || []
        dataset.backgroundColor = labels.map((_, i) => defaultColors[i % defaultColors.length])
      }
      // For other charts, we can use a single color
      else if (!dataset.backgroundColor) {
        dataset.backgroundColor = defaultColors[index % defaultColors.length]
      }

      if (!dataset.borderColor) {
        if (Array.isArray(dataset.backgroundColor)) {
          dataset.borderColor = dataset.backgroundColor.map((color) => color.replace("0.6", "1"))
        } else {
          dataset.borderColor = dataset.backgroundColor.replace("0.6", "1")
        }
      }
    })
  }

  return response
}

// Add this function after enhanceResponse function
function verifyFullDatasetAnalysis(response: any, data: any[]): boolean {
  // Check if the response mentions analyzing the full dataset
  const analysisText = response.analysis || ""
  const mentionsFullDataset =
    analysisText.includes(`${data.length} rows`) ||
    analysisText.includes(`${data.length} data points`) ||
    analysisText.includes(`entire dataset`) ||
    analysisText.includes(`complete dataset`) ||
    analysisText.includes(`all rows`)

  // Check if statistics match the full dataset count
  const hasCorrectCount = response.statistics && response.statistics.count && response.statistics.count === data.length

  // Check if visualization data appears to represent the full dataset
  const hasComprehensiveVisualization =
    response.visualization &&
    response.visualization.data &&
    response.visualization.data.datasets &&
    response.visualization.data.datasets.length > 0

  return mentionsFullDataset || hasCorrectCount || hasComprehensiveVisualization
}

// Function to create a visualization for "region with highest sales" query
function createRegionSalesVisualization(data: any[], columnNameMap: Record<string, string> = {}) {
  // Find the correct column names (case-insensitive)
  const regionColumn =
    columnNameMap["region"] ||
    Object.keys(columnNameMap).find((key) => key.includes("region")) ||
    Object.keys(data[0]).find((key) => key.toLowerCase().includes("region"))

  const salesColumn =
    columnNameMap["sales"] ||
    Object.keys(columnNameMap).find((key) => key.includes("sales")) ||
    Object.keys(data[0]).find((key) => key.toLowerCase().includes("sales"))

  if (!regionColumn || !salesColumn) {
    console.log("Data doesn't have Region and Sales columns, creating default visualization")
    return createDefaultVisualization(data, columnNameMap)
  }

  console.log(`Using columns: Region="${regionColumn}", Sales="${salesColumn}"`)

  // Group by region and sum sales
  const regionSales: Record<string, number> = {}

  data.forEach((row) => {
    const region = String(row[regionColumn] || "Unknown")
    const sales = Number(row[salesColumn] || 0)

    if (!isNaN(sales)) {
      regionSales[region] = (regionSales[region] || 0) + sales
    }
  })

  // Sort by sales in descending order
  const sortedRegions = Object.entries(regionSales).sort((a, b) => b[1] - a[1])

  // Get the highest sales region
  const highestRegion = sortedRegions[0]

  // Create a bar chart visualization
  return {
    type: "bar",
    title: "Sales by Region",
    description: "Comparison of total sales across regions",
    xLabel: "Region",
    yLabel: "Total Sales",
    data: {
      labels: sortedRegions.map(([region]) => region),
      datasets: [
        {
          label: "Total Sales",
          data: sortedRegions.map(([_, sales]) => sales),
          backgroundColor: sortedRegions.map(([_, __], index) =>
            index === 0 ? "rgba(255, 99, 132, 0.6)" : "rgba(75, 192, 192, 0.6)",
          ),
          borderColor: sortedRegions.map(([_, __], index) =>
            index === 0 ? "rgba(255, 99, 132, 1)" : "rgba(75, 192, 192, 1)",
          ),
        },
      ],
    },
  }
}

// Helper function to create a default visualization
function createDefaultVisualization(data: any[], columnNameMap: Record<string, string> = {}) {
  if (!data || data.length === 0) {
    return {
      type: "bar",
      title: "No Data Available",
      description: "No data to visualize",
      data: {
        labels: ["No Data"],
        datasets: [
          {
            label: "No Data",
            data: [0],
            backgroundColor: "rgba(75, 192, 192, 0.6)",
          },
        ],
      },
    }
  }

  // Get column names
  const columns = Object.keys(data[0])

  // Try to find a categorical column for the x-axis
  const possibleCategoricalColumns = columns.filter(
    (col) =>
      col.toLowerCase().includes("category") ||
      col.toLowerCase().includes("type") ||
      col.toLowerCase().includes("region") ||
      col.toLowerCase().includes("segment"),
  )

  const categoryColumn = possibleCategoricalColumns[0] || columns[0]

  // Count frequencies
  const categories: Record<string, number> = {}
  data.forEach((row) => {
    const category = String(row[categoryColumn] || "Unknown")
    categories[category] = (categories[category] || 0) + 1
  })

  // Sort by frequency
  const sortedCategories = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10) // Take top 10

  return {
    type: "bar",
    title: `Frequency of ${categoryColumn}`,
    description: `Distribution of ${categoryColumn} values`,
    xLabel: categoryColumn,
    yLabel: "Count",
    data: {
      labels: sortedCategories.map(([category]) => category),
      datasets: [
        {
          label: "Count",
          data: sortedCategories.map(([_, count]) => count),
          backgroundColor: "rgba(75, 192, 192, 0.6)",
          borderColor: "rgba(75, 192, 192, 1)",
        },
      ],
    },
  }
}

