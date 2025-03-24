"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Download, Database, BarChart } from "lucide-react"
import { TermTooltip } from "./term-explainer"

interface DataExplorerProps {
  data: any[]
  onGenerateQuery: (query: string) => void
}

export function DataExplorer({ data, onGenerateQuery }: DataExplorerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("preview")
  const [columnStats, setColumnStats] = useState<Record<string, any>>({})

  // Calculate basic statistics for each column
  useEffect(() => {
    if (!data || data.length === 0) return

    const columns = Object.keys(data[0])
    const stats: Record<string, any> = {}

    columns.forEach((column) => {
      // Extract values for this column
      const values = data.map((row) => row[column])

      // Count non-null values
      const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== "")
      const count = nonNullValues.length

      // Determine column type
      let type = "text"
      let numericCount = 0
      let dateCount = 0

      nonNullValues.forEach((value) => {
        if (!isNaN(Number(value))) {
          numericCount++
        }
        if (!isNaN(Date.parse(String(value)))) {
          dateCount++
        }
      })

      if (numericCount / count > 0.7) {
        type = "numeric"
      } else if (dateCount / count > 0.7) {
        type = "date"
      }

      // Calculate statistics based on type
      if (type === "numeric") {
        const numericValues = nonNullValues.map((v) => Number(v)).filter((v) => !isNaN(v))
        const sum = numericValues.reduce((acc, val) => acc + val, 0)
        const mean = sum / numericValues.length

        // Sort for median
        const sorted = [...numericValues].sort((a, b) => a - b)
        const median =
          sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
            : sorted[Math.floor(sorted.length / 2)]

        // Min and max
        const min = Math.min(...numericValues)
        const max = Math.max(...numericValues)

        // Unique values
        const uniqueValues = new Set(numericValues).size

        stats[column] = {
          type,
          count,
          uniqueValues,
          mean,
          median,
          min,
          max,
        }
      } else {
        // For text and date columns
        const uniqueValues = new Set(nonNullValues).size
        const mostCommon = findMostCommon(nonNullValues)

        stats[column] = {
          type,
          count,
          uniqueValues,
          mostCommon: mostCommon.value,
          mostCommonCount: mostCommon.count,
        }
      }
    })

    setColumnStats(stats)
  }, [data])

  // Filter data based on search term
  const filteredData =
    data?.filter((row) =>
      Object.values(row).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
    ) || []

  // Helper function to find most common value
  function findMostCommon(arr: any[]) {
    const counts: Record<string, number> = {}
    let maxCount = 0
    let maxValue = null

    arr.forEach((value) => {
      const strValue = String(value)
      counts[strValue] = (counts[strValue] || 0) + 1
      if (counts[strValue] > maxCount) {
        maxCount = counts[strValue]
        maxValue = value
      }
    })

    return { value: maxValue, count: maxCount }
  }

  // Generate analysis query for a specific column
  const generateColumnQuery = (column: string, type: string) => {
    let query = ""

    if (type === "numeric") {
      query = `Analyze the distribution of ${column} values and show key statistics`
    } else if (type === "date") {
      query = `Show trends over time based on the ${column} column`
    } else {
      query = `Show the breakdown of different ${column} values and their frequencies`
    }

    onGenerateQuery(query)
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Explorer</CardTitle>
          <CardDescription>No data available to explore</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const columns = Object.keys(data[0])

  return (
    <Card className="h-full flex flex-col overflow-hidden shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Data Explorer</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
        <CardDescription>
          Explore your dataset ({data.length.toLocaleString()} rows, {columns.length} columns)
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="px-4 py-2 border-b">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-4 border-b">
            <TabsList>
              <TabsTrigger value="preview" className="flex items-center gap-1">
                <Database className="h-4 w-4" />
                <span>Data Preview</span>
              </TabsTrigger>
              <TabsTrigger value="columns" className="flex items-center gap-1">
                <BarChart className="h-4 w-4" />
                <span>Column Stats</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="preview" className="flex-1 overflow-auto p-0 m-0 border-0">
            <div className="overflow-x-auto h-full">
              <Table className="w-full border-collapse">
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow className="border-b hover:bg-transparent">
                    {columns.map((column) => (
                      <TableHead key={column}>{column}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.slice(0, 100).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {columns.map((column) => (
                        <TableCell key={`${rowIndex}-${column}`}>
                          {typeof row[column] === "number" ? Number(row[column]).toLocaleString() : String(row[column])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredData.length > 100 && (
              <div className="p-2 text-center text-sm text-muted-foreground">
                Showing 100 of {filteredData.length.toLocaleString()} rows
              </div>
            )}
          </TabsContent>

          <TabsContent value="columns" className="flex-1 overflow-auto p-4 m-0 space-y-4 border-0">
            {columns.map((column) => (
              <Card key={column} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 bg-muted/20">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-md">{column}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => generateColumnQuery(column, columnStats[column]?.type || "text")}
                    >
                      Analyze
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    {columnStats[column]?.type === "numeric" && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        Numeric
                      </Badge>
                    )}
                    {columnStats[column]?.type === "date" && (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                      >
                        Date
                      </Badge>
                    )}
                    {columnStats[column]?.type === "text" && (
                      <Badge
                        variant="outline"
                        className="bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                      >
                        Text
                      </Badge>
                    )}
                    <Badge variant="outline">{columnStats[column]?.uniqueValues} unique values</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3">
                  {columnStats[column]?.type === "numeric" ? (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">
                          <TermTooltip term="mean">Mean</TermTooltip>:
                        </div>
                        <div className="font-medium">
                          {columnStats[column]?.mean?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">
                          <TermTooltip term="median">Median</TermTooltip>:
                        </div>
                        <div className="font-medium">
                          {columnStats[column]?.median?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Min:</div>
                        <div className="font-medium">
                          {columnStats[column]?.min?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Max:</div>
                        <div className="font-medium">
                          {columnStats[column]?.max?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm">
                      <div className="text-muted-foreground">Most common value:</div>
                      <div className="font-medium">
                        {columnStats[column]?.mostCommon}
                        <span className="text-muted-foreground ml-1">
                          ({columnStats[column]?.mostCommonCount} occurrences)
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

