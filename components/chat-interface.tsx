"use client"

import { useState, useRef, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Send, Bot, User, AlertCircle, Lightbulb, Wand2, Sparkles, Database } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { generateDataSummary } from "@/lib/csv-parser"
import { getApiKey } from "@/lib/api-key-utils"
import { GuidedAnalysis } from "./guided-analysis"
import { DataGlossary } from "./term-explainer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataExplorer } from "./data-explorer"

interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
}

interface ChatInterfaceProps {
  onResponse: (response: any) => void
  isAnalyzing: boolean
  fileInfo: any
  model?: string
}

export function ChatInterface({ onResponse, isAnalyzing, fileInfo, model = "gpt-4" }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any[] | null>(null)
  const [dataStatus, setDataStatus] = useState<"loading" | "loaded" | "error" | "not-found">("loading")
  const [activeTab, setActiveTab] = useState<"chat" | "explore" | "guide">("chat")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)

  // Load data from localStorage when component mounts
  useEffect(() => {
    const loadData = async () => {
      setDataStatus("loading")
      console.log("Attempting to load data from localStorage")

      try {
        // Get fileId from props or localStorage
        const fileId = fileInfo?.id || localStorage.getItem("fileId")

        if (!fileId) {
          console.warn("No fileId found")
          setDataStatus("not-found")
          return
        }

        console.log("Attempting to load data for fileId:", fileId)

        // Try all possible storage keys
        const possibleKeys = [`data_${fileId}`, fileId, `file_${fileId}`]
        let loadedData = null

        for (const key of possibleKeys) {
          const storedData = localStorage.getItem(key)
          if (storedData) {
            try {
              const parsedData = JSON.parse(storedData)
              if (Array.isArray(parsedData) && parsedData.length > 0) {
                console.log(`Successfully loaded ${parsedData.length} rows from key: ${key}`)
                loadedData = parsedData
                break
              }
            } catch (e) {
              console.error(`Error parsing data from key ${key}:`, e)
            }
          }
        }

        if (loadedData) {
          setData(loadedData)
          setDataStatus("loaded")
          console.log(`Data loaded successfully: ${loadedData.length} rows`)
        } else {
          console.warn("No valid data found in localStorage")
          setDataStatus("not-found")
        }
      } catch (e) {
        console.error("Error loading data:", e)
        setDataStatus("error")
      }
    }

    // Load data when the component mounts
    loadData()
  }, [fileInfo])

  // Update the welcome message generation to include data summary
  useEffect(() => {
    if (!isAnalyzing && messages.length === 0 && fileInfo) {
      console.log("Setting up welcome message with data summary")

      // Create welcome messages
      const welcomeMessages = [
        {
          id: "system-1",
          role: "system",
          content: `I've loaded your data from "${fileInfo.name}".`,
          timestamp: new Date(),
        },
      ]

      // Add different message based on data status
      if (dataStatus === "loaded" && data && data.length > 0) {
        // Generate data summary
        try {
          const dataSummary = generateDataSummary(data)

          // Create a more personalized welcome message
          welcomeMessages.push({
            id: "welcome",
            role: "assistant",
            content: `I've analyzed your dataset and here's what I found:

${dataSummary}

I can help you analyze this data even if you don't have technical experience. You can ask me questions in plain English, and I'll perform the analysis for you. Try asking things like "What are the trends in this data?" or "Show me the top performers."`,
            timestamp: new Date(),
          })
        } catch (error) {
          console.error("Error generating data summary:", error)

          // Fallback message if summary generation fails
          welcomeMessages.push({
            id: "welcome",
            role: "assistant",
            content: `I've loaded your dataset containing ${fileInfo.rowCount} rows. I can help you analyze this data even if you don't have technical experience. Just ask me questions in plain English, and I'll perform the analysis for you.`,
            timestamp: new Date(),
          })
        }
      } else if (dataStatus === "not-found") {
        welcomeMessages.push({
          id: "welcome-error",
          role: "assistant",
          content: `I couldn't find your data in the browser storage. You may need to upload your file again.`,
          timestamp: new Date(),
        })
      } else if (dataStatus === "error") {
        welcomeMessages.push({
          id: "welcome-error",
          role: "assistant",
          content: `There was an error loading your data. You may need to upload your file again.`,
          timestamp: new Date(),
        })
      }

      setMessages(welcomeMessages)
    }
  }, [isAnalyzing, fileInfo, messages.length, dataStatus, data])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when analysis completes
  useEffect(() => {
    if (!isAnalyzing && inputRef.current && activeTab === "chat") {
      inputRef.current.focus()
    }
  }, [isAnalyzing, activeTab])

  // Add this function before the processQuery function
  const validateResponseQuality = (result: any, data: any[]): boolean => {
    // Check if the response contains proper analysis
    if (!result.analysis || typeof result.analysis !== "string" || result.analysis.length < 50) {
      console.warn("Response lacks proper analysis text")
      return false
    }

    // Check if the visualization is appropriate
    if (!result.visualization || !result.visualization.type || !result.visualization.data) {
      console.warn("Response lacks proper visualization")
      return false
    }

    // Check if insights are provided
    if (!result.insights || !Array.isArray(result.insights) || result.insights.length < 2) {
      console.warn("Response lacks sufficient insights")
      return false
    }

    // Check if statistics match the dataset size
    if (!result.statistics || !result.statistics.count || result.statistics.count !== data.length) {
      console.warn("Response statistics don't match dataset size")
      return false
    }

    return true
  }

  // Process the query with GPT-4 via API
  const processQuery = async (query: string, data: any[]) => {
    let result
    try {
      console.log(`Processing query: "${query}" with ${data.length} rows of data using model: ${model}`)

      // Get API key from localStorage
      const apiKey = getApiKey()
      if (!apiKey) {
        throw new Error("OpenAI API key is required. Please set it in the API Key tab.")
      }

      // Create a mapping of lowercase column names to actual column names for case-insensitive matching
      const columnNameMap: Record<string, string> = {}
      if (data && data.length > 0) {
        const columns = Object.keys(data[0])
        columns.forEach((col) => {
          columnNameMap[col.toLowerCase()] = col
        })
      }
      console.log("Column name mapping:", columnNameMap)

      // Check if this is a query about a specific column
      const queryLower = query.toLowerCase()
      const columnMatches = Object.keys(columnNameMap).filter((colLower) => queryLower.includes(colLower))

      console.log("Detected column references in query:", columnMatches)

      // For certain common query types, we can handle them directly for better performance
      // This serves as a fallback if the LLM doesn't perform the analysis correctly

      // Check if this is a "city with highest sales" type query
      const isCitySalesQuery =
        (queryLower.includes("city") || columnMatches.some((col) => col.includes("city"))) &&
        (queryLower.includes("highest sales") ||
          queryLower.includes("most sales") ||
          queryLower.includes("maximum sales") ||
          (queryLower.includes("rank") && queryLower.includes("sales")))

      if (isCitySalesQuery) {
        console.log("Detected 'city with highest sales' query, handling directly")

        // Find the correct column names (case-insensitive)
        const cityColumn =
          columnNameMap["city"] ||
          Object.keys(columnNameMap).find((key) => key.includes("city")) ||
          Object.keys(data[0]).find((key) => key.toLowerCase().includes("city"))

        const salesColumn =
          columnNameMap["sales"] ||
          Object.keys(columnNameMap).find((key) => key.includes("sales")) ||
          Object.keys(data[0]).find((key) => key.toLowerCase().includes("sales"))

        if (!cityColumn || !salesColumn) {
          throw new Error("Could not find City and Sales columns in the data")
        }

        console.log(`Using columns: City="${cityColumn}", Sales="${salesColumn}"`)

        // Group by city and sum sales
        const citySales: Record<string, number> = {}

        data.forEach((row) => {
          const city = String(row[cityColumn] || "Unknown")
          const sales = Number(row[salesColumn] || 0)

          if (!isNaN(sales)) {
            citySales[city] = (citySales[city] || 0) + sales
          }
        })

        // Sort by sales in descending order
        const sortedCities = Object.entries(citySales).sort((a, b) => b[1] - a[1])

        // Get the highest sales city
        const highestCity = sortedCities[0]

        // Create a response message
        const assistantMessage: ChatMessage = {
          id: Date.now().toString(),
          role: "assistant",
          content: `The city with the highest sales is **${highestCity[0]}** with total sales of **${highestCity[1].toLocaleString()}**.`,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])

        // Calculate statistics
        const salesValues = sortedCities.map(([_, sales]) => sales)
        const totalSales = salesValues.reduce((sum, val) => sum + val, 0)
        const meanSales = totalSales / salesValues.length

        // Sort for median and quartiles
        const sortedSales = [...salesValues].sort((a, b) => a - b)
        const medianIndex = Math.floor(sortedSales.length / 2)
        const median =
          sortedSales.length % 2 === 0
            ? (sortedSales[medianIndex - 1] + sortedSales[medianIndex]) / 2
            : sortedSales[medianIndex]

        // Calculate quartiles
        const q1Index = Math.floor(sortedSales.length * 0.25)
        const q3Index = Math.floor(sortedSales.length * 0.75)
        const q1 = sortedSales[q1Index]
        const q3 = sortedSales[q3Index]

        // Calculate standard deviation
        const squaredDiffs = salesValues.map((val) => Math.pow(val - meanSales, 2))
        const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / salesValues.length
        const stdDev = Math.sqrt(variance)

        // Return visualization data
        result = {
          visualization: {
            type: "bar",
            title: "Sales by City",
            description: "Comparison of total sales across cities",
            xLabel: "City",
            yLabel: "Total Sales",
            data: {
              labels: sortedCities.map(([city]) => city),
              datasets: [
                {
                  label: "Total Sales",
                  data: sortedCities.map(([_, sales]) => sales),
                  backgroundColor: sortedCities.map((_, index) =>
                    index === 0 ? "rgba(255, 99, 132, 0.6)" : "rgba(75, 192, 192, 0.6)",
                  ),
                  borderColor: sortedCities.map((_, index) =>
                    index === 0 ? "rgba(255, 99, 132, 1)" : "rgba(75, 192, 192, 1)",
                  ),
                },
              ],
            },
          },
          insights: [
            `${highestCity[0]} has the highest total sales at ${highestCity[1].toLocaleString()}.`,
            `The difference between the highest and second highest city is ${
              sortedCities.length > 1 ? (highestCity[1] - sortedCities[1][1]).toLocaleString() : "N/A"
            }.`,
            `There are ${Object.keys(citySales).length} cities in total.`,
          ],
          statistics: {
            mean: meanSales,
            median: median,
            standardDeviation: stdDev,
            min: Math.min(...salesValues),
            max: Math.max(...salesValues),
            count: salesValues.length,
            quartile1: q1,
            quartile3: q3,
          },
        }
        return result
      }

      // For most queries, we'll use the LLM to perform the analysis
      console.log("Using LLM to perform data analysis and visualization")

      // Preprocess the query to better handle natural language
      const processedQuery = preprocessQuery(query)

      // Send the complete dataset for analysis
      console.log(`Sending complete dataset (${data.length} rows) for analysis`)

      // Call the analyze API endpoint
      try {
        console.log(`Sending complete dataset (${data.length} rows) for analysis...`)

        // Show a more detailed toast for large datasets
        if (data.length > 1000) {
          toast({
            title: "Processing Large Dataset",
            description: `Analyzing all ${data.length} rows. This may take a moment...`,
            duration: 5000,
          })
        }

        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: processedQuery,
            data: data, // Send the complete dataset
            apiKey,
            model,
            columnNameMap,
          }),
        })

        // Check if the response is JSON
        const contentType = response.headers.get("content-type")
        if (!contentType || !contentType.includes("application/json")) {
          // Not JSON, get the text and throw an error
          const errorText = await response.text()
          console.error("Non-JSON response from API:", errorText)
          throw new Error("Server returned a non-JSON response: " + errorText.substring(0, 100))
        }

        // Parse the JSON response
        result = await response.json()

        // Validate response quality
        const isQualityResponse = validateResponseQuality(result, data)
        if (!isQualityResponse) {
          console.warn("Low quality response detected, may need to retry or refine query")

          // Add a note to the analysis if it exists
          if (result.analysis) {
            result.analysis = `${result.analysis}\n\nNote: This analysis is based on all ${data.length} rows in your dataset.`
          }

          // Ensure statistics include the correct count
          if (!result.statistics) {
            result.statistics = { count: data.length }
          } else {
            result.statistics.count = data.length
          }
        }

        // Check if the response contains an error
        if (!response.ok) {
          throw new Error(result.error || result.details || "Failed to analyze data")
        }

        console.log("API response:", result)
      } catch (error) {
        // Handle fetch or JSON parsing errors
        console.error("Error in API call:", error)
        if (error instanceof SyntaxError) {
          throw new Error("Failed to parse API response as JSON")
        }
        throw error
      }

      // Check if the response contains a proper visualization
      if (!result.visualization || !result.visualization.data) {
        console.warn("Response doesn't contain proper visualization data:", result)

        // Try to extract visualization data from the analysis text if it contains JSON
        if (result.analysis && result.analysis.includes("```json")) {
          try {
            const jsonMatch = result.analysis.match(/```json\s*([\s\S]*?)\s*```/)
            if (jsonMatch && jsonMatch[1]) {
              const extractedJson = JSON.parse(jsonMatch[1])
              console.log("Extracted JSON from analysis text:", extractedJson)

              if (extractedJson.visualization) {
                result.visualization = extractedJson.visualization
              }
              if (extractedJson.insights) {
                result.insights = extractedJson.insights
              }
              if (extractedJson.statistics) {
                result.statistics = extractedJson.statistics
              }
            }
          } catch (e) {
            console.error("Failed to extract JSON from analysis text:", e)
          }
        }
      }

      // If still no visualization, create a basic one
      if (!result.visualization || !result.visualization.data) {
        console.log("LLM did not provide visualization, creating one from the data directly")
        // Create a basic visualization from the data
        result.visualization = createBasicVisualization(data, query, columnNameMap)
      }
    } catch (error) {
      console.error("Error processing query:", error)
      throw error
    }

    // Create a response message from the analysis
    const assistantMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "assistant",
      content: result.analysis || "I've analyzed your data based on your query.",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, assistantMessage])

    // Return the response for visualization
    return {
      visualization: result.visualization,
      insights: result.insights || [],
      statistics: result.statistics || {},
      data: data.slice(0, 100), // Send a sample of the data for reference
    }
  }

  // Helper function to preprocess natural language queries
  const preprocessQuery = (query: string): string => {
    // Convert to lowercase for easier matching
    const lowerQuery = query.toLowerCase()

    // Check for "top N" patterns
    const topNMatch =
      lowerQuery.match(/top\s+(\d+)/i) || lowerQuery.match(/(\d+)\s+highest/i) || lowerQuery.match(/(\d+)\s+most/i)

    if (topNMatch) {
      console.log(`Detected "top N" query pattern: ${topNMatch[0]}`)
    }

    // Check for "show me" or similar patterns
    if (lowerQuery.startsWith("show") || lowerQuery.startsWith("display") || lowerQuery.startsWith("give me")) {
      console.log("Detected 'show me' type query pattern")
    }

    // No need to modify the query, just log the detection
    return query
  }

  // Helper function to create a basic visualization when the API response doesn't include one
  const createBasicVisualization = (data: any[], query: string, columnNameMap: Record<string, string> = {}) => {
    // Check if this is a "region with highest sales" type query
    const queryLower = query.toLowerCase()
    const isRegionSalesQuery =
      (queryLower.includes("region") || Object.keys(columnNameMap).some((col) => col.includes("region"))) &&
      (queryLower.includes("highest sales") ||
        queryLower.includes("most sales") ||
        queryLower.includes("maximum sales"))

    if (isRegionSalesQuery) {
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
        console.warn("Could not find Region and Sales columns, using default columns")
        return createDefaultVisualization(data)
      }

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

    // Get column names
    const columns = Object.keys(data[0] || {})

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

  // Helper function to create a default visualization
  const createDefaultVisualization = (data: any[]) => {
    // Get column names
    const columns = Object.keys(data[0] || {})

    // Use the first column as the category
    const categoryColumn = columns[0]

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
      title: `Overview of ${categoryColumn}`,
      description: `Distribution of values in the dataset`,
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

  // Generate suggested questions based on data
  const getSuggestedQuestions = () => {
    // Get column names from data if available
    let columns: string[] = []
    if (data && data.length > 0) {
      columns = Object.keys(data[0])
    }

    // Select a random categorical column if available
    let categoricalColumn = ""
    let numericColumn = ""

    if (columns.length > 0) {
      // Try to find columns that might be categorical
      const possibleCategoricalColumns = columns.filter(
        (col) =>
          col.toLowerCase().includes("category") ||
          col.toLowerCase().includes("type") ||
          col.toLowerCase().includes("status") ||
          col.toLowerCase().includes("gender") ||
          col.toLowerCase().includes("region") ||
          col.toLowerCase().includes("country") ||
          col.toLowerCase().includes("city") ||
          col.toLowerCase().includes("state"),
      )

      if (possibleCategoricalColumns.length > 0) {
        categoricalColumn = possibleCategoricalColumns[Math.floor(Math.random() * possibleCategoricalColumns.length)]
      } else {
        // Just pick a random column
        categoricalColumn = columns[Math.floor(Math.random() * columns.length)]
      }

      // Try to find columns that might be numeric
      const possibleNumericColumns = columns.filter(
        (col) =>
          col.toLowerCase().includes("sales") ||
          col.toLowerCase().includes("revenue") ||
          col.toLowerCase().includes("profit") ||
          col.toLowerCase().includes("amount") ||
          col.toLowerCase().includes("price") ||
          col.toLowerCase().includes("count") ||
          col.toLowerCase().includes("quantity") ||
          col.toLowerCase().includes("value"),
      )

      if (possibleNumericColumns.length > 0) {
        numericColumn = possibleNumericColumns[Math.floor(Math.random() * possibleNumericColumns.length)]
      }
    }

    const analysisQuestions = [
      "What insights can you find in this data?",
      "What are the main trends in this dataset?",
      "Give me a summary of the key patterns in this data",
      "What are the most important findings in this dataset?",
      "What stands out in this data?",
    ]

    // Add frequency-specific questions if we have a categorical column
    const frequencyQuestions = categoricalColumn
      ? [
          `Show me the distribution of ${categoricalColumn}`,
          `What's the breakdown of ${categoricalColumn}?`,
          `Create a chart showing ${categoricalColumn} distribution`,
          `How many of each ${categoricalColumn} do we have?`,
        ]
      : []

    // Add "top N" questions if we have both categorical and numeric columns
    const topNQuestions =
      categoricalColumn && numericColumn
        ? [
            `What are the top 5 ${categoricalColumn} by ${numericColumn}?`,
            `Which ${categoricalColumn} has the highest ${numericColumn}?`,
            `Compare ${numericColumn} across different ${categoricalColumn}`,
            `Show me the best performing ${categoricalColumn}`,
          ]
        : []

    // Combine and shuffle questions
    const allQuestions = [...analysisQuestions, ...frequencyQuestions, ...topNQuestions]
    return allQuestions.sort(() => 0.5 - Math.random()).slice(0, 4)
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading || isAnalyzing || dataStatus !== "loaded") {
      return
    }

    const query = input.trim()
    setInput("")

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    setError(null)

    try {
      // Check if we have data
      if (!data || data.length === 0) {
        throw new Error("No data available. Please upload a file first.")
      }

      // Process the query with GPT-4 via API
      const response = await processQuery(input, data)

      // Update the visualization and insights
      if (response) {
        console.log("Sending visualization data to parent:", response.visualization)

        // Ensure we have a valid visualization object
        const visualization = response.visualization || createBasicVisualization(data, "bar")

        // Ensure the visualization has all required properties
        if (!visualization.type) visualization.type = "bar"
        if (!visualization.title) visualization.title = "Data Analysis"
        if (!visualization.data) {
          visualization.data = {
            labels: ["No Data"],
            datasets: [
              {
                label: "No Data",
                data: [0],
                backgroundColor: "rgba(75, 192, 192, 0.6)",
              },
            ],
          }
        }

        onResponse({
          chart: visualization,
          insights: response.insights || ["No specific insights were generated."],
          statistics: response.statistics || { count: data.length },
          data: data.slice(0, 100), // Send a sample of the data for reference
        })
      }
    } catch (error) {
      console.error("Error processing request:", error)

      // Create a more user-friendly error message
      let errorMessage = "Failed to analyze your data. Please try again."
      let errorTitle = "Analysis Error"

      if (error instanceof Error) {
        if (error.message.includes("JSON") || error.message.includes("Unexpected token")) {
          errorMessage = "The AI had trouble formatting its response. I'll try to analyze your data anyway."
          errorTitle = "Formatting Issue"

          // Try to continue with a basic analysis despite the error
          if (data && data.length > 0) {
            try {
              // Create a basic visualization
              const basicVisualization = createBasicVisualization(data, input)

              // Add a note about the error to the chat
              const errorNote: ChatMessage = {
                id: Date.now().toString() + "-error",
                role: "system",
                content:
                  "Note: There was an issue with the AI's response format, but I've created a basic analysis for you.",
                timestamp: new Date(),
              }

              setMessages((prev) => [...prev, errorNote])

              // Still show visualization
              onResponse({
                chart: basicVisualization,
                insights: ["The AI had trouble with this query. Here's a basic analysis instead."],
                statistics: { count: data.length },
                data: data.slice(0, 100),
              })

              // Don't show the error alert in this case
              setError(null)
              return
            } catch (fallbackError) {
              console.error("Error creating fallback visualization:", fallbackError)
            }
          }
        } else if (error.message.includes("API key")) {
          errorMessage = "There's an issue with your API key. Please check your settings."
          errorTitle = "API Key Error"
        } else if (error.message.includes("timeout") || error.message.includes("aborted")) {
          errorMessage = "The analysis took too long to complete. Try a more specific question or a smaller dataset."
          errorTitle = "Timeout Error"
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = "Network error. Please check your internet connection and try again."
          errorTitle = "Network Error"
        } else {
          errorMessage = error.message
        }
      }

      setError(errorMessage)
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      })

      // Still show a basic visualization if possible
      if (data && data.length > 0) {
        onResponse({
          chart: createBasicVisualization(data, input),
          insights: ["Analysis could not be completed. Please try a different question."],
          statistics: { count: data.length },
          data: data.slice(0, 100),
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuidedQuery = (query: string) => {
    setInput(query)
    setActiveTab("chat")
    // Focus the input after a short delay to ensure the tab switch is complete
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  return (
    <Card className="flex flex-col h-full shadow-sm">
      <CardHeader className="pb-2 flex-shrink-0 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-md flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            AskData AI
          </CardTitle>
          <div className="flex items-center gap-2">
            <DataGlossary />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab as any} className="h-full flex flex-col">
          <div className="px-4 border-b flex-shrink-0">
            <TabsList>
              <TabsTrigger value="chat" className="flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                <span>Chat</span>
              </TabsTrigger>
              <TabsTrigger value="explore" className="flex items-center gap-1">
                <Database className="h-4 w-4" />
                <span>Explore Data</span>
              </TabsTrigger>
              <TabsTrigger value="guide" className="flex items-center gap-1">
                <Wand2 className="h-4 w-4" />
                <span>Guided Analysis</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="chat" className="flex-1 overflow-hidden p-0 m-0 flex flex-col">
            <ScrollArea className="h-[calc(100%-3.5rem)] p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    {message.role === "system" ? (
                      <div className="w-full bg-muted/50 rounded-lg px-3 py-2 text-sm text-center">
                        {message.content}
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 max-w-[85%] group">
                        {message.role === "assistant" && (
                          <Avatar className="h-8 w-8 mt-0.5">
                            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI" />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`rounded-lg px-3 py-2 text-sm ${
                            message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          {message.content}
                          <div className="text-xs mt-1 opacity-0 group-hover:opacity-70 transition-opacity">
                            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        {message.role === "user" && (
                          <Avatar className="h-8 w-8 mt-0.5">
                            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                            <AvatarFallback className="bg-secondary text-secondary-foreground">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-2 max-w-[85%]">
                      <Avatar className="h-8 w-8 mt-0.5">
                        <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI" />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="rounded-lg px-3 py-2 text-sm bg-muted min-w-[60px]">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-primary/60 animate-pulse"></span>
                          <span className="w-2 h-2 rounded-full bg-primary/60 animate-pulse delay-150"></span>
                          <span className="w-2 h-2 rounded-full bg-primary/60 animate-pulse delay-300"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {dataStatus === "not-found" && !isLoading && (
                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>No data found in browser storage. Please upload a file again.</AlertDescription>
                  </Alert>
                )}

                {!isAnalyzing && messages.length > 0 && !isLoading && dataStatus === "loaded" && (
                  <div className="mt-6">
                    <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
                    <div className="flex flex-wrap gap-2">
                      {getSuggestedQuestions().map((question, index) => (
                        <button
                          key={index}
                          className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-2 py-1 rounded-full transition-colors"
                          onClick={() => {
                            setInput(question)
                            inputRef.current?.focus()
                          }}
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="p-4 border-t">
              <div className="flex w-full items-center space-x-2">
                <Input
                  ref={inputRef}
                  placeholder={
                    isAnalyzing
                      ? "Wait for processing to complete..."
                      : dataStatus !== "loaded"
                        ? "Please upload a file first..."
                        : "Ask about your data in plain English..."
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isLoading && !isAnalyzing && dataStatus === "loaded") {
                      handleSend()
                    }
                  }}
                  disabled={isLoading || isAnalyzing || dataStatus !== "loaded"}
                  className="bg-background"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={isLoading || !input.trim() || isAnalyzing || dataStatus !== "loaded"}
                  className="shrink-0 transition-all duration-300 hover:bg-primary/90 hover:scale-[1.05] active:scale-[0.95]"
                >
                  {isLoading ? <span className="animate-spin">⏳</span> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex items-center mt-2">
                <Lightbulb className="h-3 w-3 text-amber-500 mr-1" />
                <p className="text-xs text-muted-foreground">
                  Tip: Ask questions in plain English like "What are the trends?" or "Show me the top performers"
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="explore" className="flex-1 overflow-hidden p-0 m-0">
            {data && data.length > 0 ? (
              <DataExplorer data={data} onGenerateQuery={handleGuidedQuery} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-4">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Data Available</h3>
                  <p className="text-muted-foreground">Please upload a file to explore your data</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="guide" className="flex-1 overflow-auto p-4 m-0">
            <GuidedAnalysis
              onSelectQuery={handleGuidedQuery}
              dataColumns={data && data.length > 0 ? Object.keys(data[0]) : []}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

