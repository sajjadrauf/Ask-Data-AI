/**
 * Parse CSV data with improved flexibility
 */
export function parseCSV(csvContent: string) {
  try {
    console.log("Parsing CSV content...")
    // Split the content into lines
    const lines = csvContent.split(/\r?\n/).filter((line) => line.trim() !== "")

    if (lines.length < 2) {
      console.warn("CSV has too few lines")
      return []
    }

    // Extract headers, handling quotes if present
    const headers = parseCSVLine(lines[0])
    console.log("CSV headers:", headers)

    // Create an array of objects where each object represents a row
    const data = []
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue

      const values = parseCSVLine(lines[i])

      // Create an object for this row
      const row: Record<string, any> = {}
      for (let j = 0; j < headers.length && j < values.length; j++) {
        row[headers[j]] = values[j]
      }

      data.push(row)
    }

    console.log(`Parsed ${data.length} rows of CSV data`)
    return data
  } catch (error) {
    console.error("Error parsing CSV:", error)
    return []
  }
}

/**
 * Parse a single CSV line, handling quoted values correctly
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let currentValue = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"' && (i === 0 || line[i - 1] !== "\\")) {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      values.push(currentValue.trim())
      currentValue = ""
    } else {
      currentValue += char
    }
  }

  // Add the last value
  values.push(currentValue.trim())

  // Clean up values (remove surrounding quotes)
  return values.map((value) => {
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.substring(1, value.length - 1)
    }
    return value
  })
}

/**
 * Detect if data appears to be student data
 */
export function detectDataType(csvData: any[]): {
  type: "student" | "sales" | "generic"
  metadata: any
} {
  if (!csvData || csvData.length === 0) {
    return { type: "generic", metadata: {} }
  }

  const firstRow = csvData[0]
  const headers = Object.keys(firstRow).map((h) => h.toLowerCase())
  console.log("Headers for data type detection:", headers)

  // Check for student data - more strict matching
  const studentHeadersExact = [
    "student",
    "student_id",
    "student_name",
    "birthdate",
    "dob",
    "date_of_birth",
    "grade",
    "class",
    "classroom",
  ]
  const studentHeadersPartial = ["name", "birth", "age", "grade", "class", "student"]

  // Count exact matches
  const exactStudentMatches = headers.filter((h) => studentHeadersExact.includes(h)).length
  // Count partial matches
  const partialStudentMatches = headers.filter((h) => studentHeadersPartial.some((sh) => h.includes(sh))).length

  console.log("Student data matches - Exact:", exactStudentMatches, "Partial:", partialStudentMatches)

  // Check for sales data - more strict matching
  const salesHeadersExact = [
    "sale",
    "sales",
    "revenue",
    "product",
    "product_id",
    "customer",
    "customer_id",
    "order",
    "order_id",
    "price",
    "quantity",
  ]
  const salesHeadersPartial = ["sale", "revenue", "product", "customer", "order", "price", "quantity", "transaction"]

  // Count exact matches
  const exactSalesMatches = headers.filter((h) => salesHeadersExact.includes(h)).length
  // Count partial matches
  const partialSalesMatches = headers.filter((h) => salesHeadersPartial.some((sh) => h.includes(sh))).length

  console.log("Sales data matches - Exact:", exactSalesMatches, "Partial:", partialSalesMatches)

  // Determine data type based on match counts
  // Require at least 2 exact matches or 3 partial matches for a specific type
  if (exactStudentMatches >= 2 || partialStudentMatches >= 3) {
    return {
      type: "student",
      metadata: {
        rowCount: csvData.length,
        hasNames: headers.some((h) => h.includes("name")),
        hasBirthdate: headers.some((h) => h.includes("birth") || h.includes("dob")),
        hasGrades: headers.some((h) => h.includes("grade")),
      },
    }
  }

  if (exactSalesMatches >= 2 || partialSalesMatches >= 3) {
    return {
      type: "sales",
      metadata: {
        rowCount: csvData.length,
        hasProducts: headers.some((h) => h.includes("product")),
        hasCustomers: headers.some((h) => h.includes("customer")),
        hasRevenue: headers.some((h) => h.includes("revenue") || h.includes("sale")),
      },
    }
  }

  // Default to generic
  return {
    type: "generic",
    metadata: {
      rowCount: csvData.length,
      columnCount: headers.length,
      columns: headers,
    },
  }
}

// Update the generateDataSummary function to provide more comprehensive AI-driven insights

/**
 * Generate a comprehensive AI-driven summary of the data
 */
export function generateDataSummary(data: any[]): string {
  if (!data || data.length === 0) {
    return "No data available for analysis."
  }

  // Get basic dataset information
  const rowCount = data.length
  const columns = Object.keys(data[0])
  const columnCount = columns.length

  // Analyze column types
  const columnTypes: Record<string, string> = {}
  const numericColumns: string[] = []
  const categoricalColumns: string[] = []
  const dateColumns: string[] = []
  const textColumns: string[] = []

  columns.forEach((column) => {
    let numericCount = 0
    let dateCount = 0
    let emptyCount = 0
    const uniqueValues = new Set()

    // Check a sample of rows to determine column type
    const sampleSize = Math.min(100, rowCount)
    for (let i = 0; i < sampleSize; i++) {
      const value = data[i][column]

      // Check for empty values
      if (value === null || value === undefined || value === "") {
        emptyCount++
        continue
      }

      // Add to unique values
      uniqueValues.add(String(value).toLowerCase())

      // Check if value is numeric
      if (!isNaN(Number(value)) && value !== "") {
        numericCount++
      }
      // Check if value is a date
      else if (!isNaN(Date.parse(String(value)))) {
        dateCount++
      }
    }

    // Determine column type
    const validSamples = sampleSize - emptyCount
    if (validSamples === 0) {
      columnTypes[column] = "unknown"
    } else if (numericCount / validSamples > 0.7) {
      columnTypes[column] = "numeric"
      numericColumns.push(column)
    } else if (dateCount / validSamples > 0.7) {
      columnTypes[column] = "date"
      dateColumns.push(column)
    } else if (uniqueValues.size <= 20 || uniqueValues.size / validSamples < 0.2) {
      columnTypes[column] = "categorical"
      categoricalColumns.push(column)
    } else {
      columnTypes[column] = "text"
      textColumns.push(column)
    }
  })

  // Generate summary text
  let summary = `📊 **Dataset Overview**\n`
  summary += `- **Rows**: ${rowCount.toLocaleString()}\n`
  summary += `- **Columns**: ${columnCount}\n\n`

  // Add column type breakdown
  summary += `📋 **Column Types**:\n`
  summary += `- **Numeric Columns**: ${numericColumns.length} (${numericColumns.join(", ")})\n`
  summary += `- **Categorical Columns**: ${categoricalColumns.length} (${categoricalColumns.join(", ")})\n`
  if (dateColumns.length > 0) {
    summary += `- **Date Columns**: ${dateColumns.length} (${dateColumns.join(", ")})\n`
  }
  if (textColumns.length > 0) {
    summary += `- **Text Columns**: ${textColumns.length} (${textColumns.join(", ")})\n`
  }

  // Add data quality information
  summary += `\n🔍 **Data Quality**:\n`

  // Check for missing values
  let totalMissing = 0
  const missingByColumn: Record<string, number> = {}

  columns.forEach((column) => {
    const missingCount = data.filter(
      (row) => row[column] === null || row[column] === undefined || row[column] === "",
    ).length

    missingByColumn[column] = missingCount
    totalMissing += missingCount
  })

  const missingPercentage = ((totalMissing / (rowCount * columnCount)) * 100).toFixed(2)
  summary += `- **Missing Values**: ${missingPercentage}% of all cells\n`

  // Identify columns with high missing values
  const highMissingColumns = Object.entries(missingByColumn)
    .filter(([_, count]) => count / rowCount > 0.1)
    .map(([col, count]) => `${col} (${((count / rowCount) * 100).toFixed(1)}%)`)

  if (highMissingColumns.length > 0) {
    summary += `- **Columns with >10% missing**: ${highMissingColumns.join(", ")}\n`
  }

  // Add sample statistics for numeric columns
  if (numericColumns.length > 0) {
    summary += `\n📈 **Numeric Column Statistics**:\n`

    // Calculate basic statistics for the first 2 numeric columns
    const statsColumns = numericColumns.slice(0, 2)

    statsColumns.forEach((column) => {
      const values = data.map((row) => Number(row[column])).filter((val) => !isNaN(val))

      if (values.length > 0) {
        const min = Math.min(...values)
        const max = Math.max(...values)
        const sum = values.reduce((acc, val) => acc + val, 0)
        const mean = sum / values.length

        summary += `- **${column}**: Range ${min.toLocaleString()} to ${max.toLocaleString()}, Avg ${mean.toLocaleString(undefined, { maximumFractionDigits: 2 })}\n`
      }
    })
  }

  // Add sample distributions for categorical columns
  if (categoricalColumns.length > 0) {
    summary += `\n🔢 **Categorical Column Distributions**:\n`

    // Show distributions for the first categorical column
    const firstCatColumn = categoricalColumns[0]

    // Count occurrences of each value
    const valueCounts: Record<string, number> = {}
    data.forEach((row) => {
      const value = String(row[firstCatColumn] || "Unknown")
      valueCounts[value] = (valueCounts[value] || 0) + 1
    })

    // Sort by count and take top 3
    const topValues = Object.entries(valueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    summary += `- **${firstCatColumn}**: ${topValues
      .map(([val, count]) => `${val} (${((count / rowCount) * 100).toFixed(1)}%)`)
      .join(", ")}\n`
  }

  return summary
}

