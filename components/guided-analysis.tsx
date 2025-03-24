"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronRight, BarChart3, LineChart, PieChart, TrendingUp, Search, HelpCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface GuidedAnalysisProps {
  onSelectQuery: (query: string) => void
  dataColumns?: string[]
}

export function GuidedAnalysis({ onSelectQuery, dataColumns = [] }: GuidedAnalysisProps) {
  const [activeTab, setActiveTab] = useState("common")

  // Common analysis patterns that work with most datasets
  const commonQueries = [
    {
      title: "Overview Analysis",
      description: "Get a general overview of the data",
      icon: <Search className="h-4 w-4 text-primary" />,
      query: "Give me a general overview of this dataset with key statistics and insights",
    },
    {
      title: "Top Values",
      description: "Find the highest values in the data",
      icon: <TrendingUp className="h-4 w-4 text-primary" />,
      query: "What are the top 5 highest values in this dataset?",
    },
    {
      title: "Distribution Analysis",
      description: "Analyze how values are distributed",
      icon: <BarChart3 className="h-4 w-4 text-primary" />,
      query: "Show me the distribution of values in this dataset",
    },
    {
      title: "Trend Analysis",
      description: "Identify trends over time",
      icon: <LineChart className="h-4 w-4 text-primary" />,
      query: "Are there any trends in this data over time?",
    },
    {
      title: "Comparison Analysis",
      description: "Compare different categories",
      icon: <PieChart className="h-4 w-4 text-primary" />,
      query: "Compare the different categories in this dataset",
    },
  ]

  // Generate column-specific queries if columns are provided
  const generateColumnQueries = () => {
    if (!dataColumns || dataColumns.length === 0) {
      return [
        {
          title: "No columns detected",
          description: "Upload data to see column-specific analysis options",
          icon: <HelpCircle className="h-4 w-4 text-muted-foreground" />,
          query: "",
        },
      ]
    }

    // Find potential numeric and categorical columns
    const potentialNumericColumns = dataColumns.filter(
      (col) =>
        col.toLowerCase().includes("sales") ||
        col.toLowerCase().includes("revenue") ||
        col.toLowerCase().includes("price") ||
        col.toLowerCase().includes("amount") ||
        col.toLowerCase().includes("count") ||
        col.toLowerCase().includes("quantity") ||
        col.toLowerCase().includes("value"),
    )

    const potentialCategoricalColumns = dataColumns.filter(
      (col) =>
        col.toLowerCase().includes("category") ||
        col.toLowerCase().includes("type") ||
        col.toLowerCase().includes("region") ||
        col.toLowerCase().includes("country") ||
        col.toLowerCase().includes("city") ||
        col.toLowerCase().includes("state") ||
        col.toLowerCase().includes("product") ||
        col.toLowerCase().includes("customer"),
    )

    const columnQueries = []

    // Add column-specific queries
    if (potentialNumericColumns.length > 0) {
      const numericCol = potentialNumericColumns[0]
      columnQueries.push({
        title: `Analyze ${numericCol}`,
        description: `Statistical analysis of ${numericCol}`,
        icon: <BarChart3 className="h-4 w-4 text-primary" />,
        query: `Analyze the distribution of ${numericCol} values`,
      })
    }

    if (potentialCategoricalColumns.length > 0) {
      const catCol = potentialCategoricalColumns[0]
      columnQueries.push({
        title: `Breakdown by ${catCol}`,
        description: `Group and analyze by ${catCol}`,
        icon: <PieChart className="h-4 w-4 text-primary" />,
        query: `Show me a breakdown of data by ${catCol}`,
      })
    }

    // If we have both numeric and categorical columns, add comparison query
    if (potentialNumericColumns.length > 0 && potentialCategoricalColumns.length > 0) {
      const numericCol = potentialNumericColumns[0]
      const catCol = potentialCategoricalColumns[0]
      columnQueries.push({
        title: `${numericCol} by ${catCol}`,
        description: `Compare ${numericCol} across different ${catCol}`,
        icon: <BarChart3 className="h-4 w-4 text-primary" />,
        query: `Compare ${numericCol} across different ${catCol}`,
      })
    }

    // Add general column queries
    dataColumns.slice(0, 3).forEach((column) => {
      columnQueries.push({
        title: `Explore ${column}`,
        description: `Analyze the ${column} column`,
        icon: <Search className="h-4 w-4 text-primary" />,
        query: `Tell me about the ${column} column and show relevant visualizations`,
      })
    })

    return columnQueries
  }

  const columnQueries = generateColumnQueries()

  // Business-specific queries that are common in data analysis
  const businessQueries = [
    {
      title: "Sales Performance",
      description: "Analyze sales performance",
      icon: <TrendingUp className="h-4 w-4 text-primary" />,
      query: "Analyze sales performance and identify top performing products or regions",
    },
    {
      title: "Customer Segmentation",
      description: "Segment customers by behavior",
      icon: <PieChart className="h-4 w-4 text-primary" />,
      query: "Segment customers based on their behavior or characteristics",
    },
    {
      title: "Market Analysis",
      description: "Analyze market trends",
      icon: <BarChart3 className="h-4 w-4 text-primary" />,
      query: "Analyze market trends and identify growth opportunities",
    },
    {
      title: "Performance Metrics",
      description: "Calculate key performance metrics",
      icon: <LineChart className="h-4 w-4 text-primary" />,
      query: "Calculate key performance metrics and show them in a dashboard",
    },
  ]

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-md">Guided Analysis</CardTitle>
        <CardDescription>Select an analysis type to get started</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="common">Common</TabsTrigger>
            <TabsTrigger value="columns">Column-Specific</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
          </TabsList>
          <TabsContent value="common" className="p-4 space-y-2">
            {commonQueries.map((item, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-between text-left h-auto py-3 px-4 mb-2"
                onClick={() => onSelectQuery(item.query)}
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            ))}
          </TabsContent>
          <TabsContent value="columns" className="p-4 space-y-2">
            {columnQueries.map((item, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-between text-left h-auto py-3 px-4 mb-2"
                onClick={() => item.query && onSelectQuery(item.query)}
                disabled={!item.query}
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            ))}
          </TabsContent>
          <TabsContent value="business" className="p-4 space-y-2">
            {businessQueries.map((item, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-between text-left h-auto py-3 px-4 mb-2"
                onClick={() => onSelectQuery(item.query)}
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

