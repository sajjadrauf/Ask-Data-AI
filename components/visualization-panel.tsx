"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart } from "@/components/charts/bar-chart"
import { LineChart } from "@/components/charts/line-chart"
import { PieChart } from "@/components/charts/pie-chart"
import { ScatterChart } from "@/components/charts/scatter-chart"
import { BoxPlot } from "@/components/charts/box-plot"
import { HeatMap } from "@/components/charts/heat-map"
import { DataTable } from "@/components/data-table"
import { InsightsList } from "@/components/insights-list"
import { StatisticsPanel } from "@/components/statistics-panel"
import ChartCustomizationPanel from "@/components/advanced-chart-customizer"
import {
  AlertCircle,
  BarChart2,
  LineChartIcon,
  PieChartIcon,
  ScatterChartIcon,
  BoxSelect,
  Grid3X3,
  Lightbulb,
  Palette,
  Download,
  Loader2,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TermTooltip } from "./term-explainer"
import { useToast } from "@/hooks/use-toast"
import html2canvas from "html2canvas"
import { Button } from "@/components/ui/button"

interface VisualizationPanelProps {
  data: any
  isLoading?: boolean
  onResponse: (data: any) => void
  visualization: any
}

export function VisualizationPanel({ data, isLoading = false, onResponse, visualization }: VisualizationPanelProps) {
  const [activeTab, setActiveTab] = useState("chart")
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const [currentChart, setCurrentChart] = useState<any>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Ensure chart is ready before allowing export
  const [chartReady, setChartReady] = useState(false)

  // Reset error when data changes
  useEffect(() => {
    setError(null)

    // Update current chart when data changes
    if (data && data.chart) {
      setCurrentChart(data.chart)
    }
  }, [data])

  useEffect(() => {
    // Set chart as ready after a short delay to ensure rendering is complete
    const timer = setTimeout(() => {
      setChartReady(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [visualization])

  // Validate data structure
  useEffect(() => {
    if (!data) return

    try {
      // Check if we have a chart
      if (!data.chart) {
        setError("No chart data available")
        return
      }

      // Check chart type
      const validTypes = ["bar", "line", "pie", "scatter", "boxplot", "heatmap"]
      if (!validTypes.includes(data.chart.type)) {
        setError(`Unsupported chart type: ${data.chart.type}`)
        return
      }

      // Check if we have data for the chart
      if (!data.chart.data) {
        setError("Chart data is missing")
        return
      }

      // Specific validation for each chart type
      switch (data.chart.type) {
        case "bar":
        case "line":
        case "pie":
          if (!data.chart.data.labels || !data.chart.data.datasets) {
            setError("Chart data is missing labels or datasets")
            return
          }
          break
        case "scatter":
          if (!data.chart.data.datasets || !data.chart.data.datasets[0].data) {
            setError("Scatter chart data is missing or invalid")
            return
          }
          break
        case "boxplot":
          if (!data.chart.data.boxplotData) {
            setError("Boxplot data is missing")
            return
          }
          break
        case "heatmap":
          if (!data.chart.data.matrix || !data.chart.data.rowLabels || !data.chart.data.colLabels) {
            setError("Heatmap data is missing or invalid")
            return
          }
          break
      }
    } catch (e) {
      console.error("Error validating visualization data:", e)
      setError("Invalid visualization data structure")
    }
  }, [data])

  // Function to handle customization changes
  const handleCustomizationApply = (customization: any) => {
    if (!currentChart) return

    // Create a deep copy of the current chart
    const updatedChart = JSON.parse(JSON.stringify(currentChart))

    // Apply title and labels
    if (customization.title !== undefined) {
      updatedChart.title = customization.title
    }

    if (customization.xLabel !== undefined) {
      updatedChart.xLabel = customization.xLabel
    }

    if (customization.yLabel !== undefined) {
      updatedChart.yLabel = customization.yLabel
    }

    // Apply colors
    if (customization.colors) {
      Object.entries(customization.colors).forEach(([index, color]) => {
        const datasetIndex = Number(index)
        if (updatedChart.data.datasets[datasetIndex]) {
          // For pie charts, we need an array of colors
          if (updatedChart.type === "pie") {
            updatedChart.data.datasets[datasetIndex].backgroundColor = updatedChart.data.labels.map(() => color)
          } else {
            updatedChart.data.datasets[datasetIndex].backgroundColor = color

            // For line charts, also update border color
            if (updatedChart.type === "line") {
              updatedChart.data.datasets[datasetIndex].borderColor = color
            }
          }
        }
      })
    }

    // Apply options
    if (customization.options) {
      updatedChart.options = {
        ...(updatedChart.options || {}),
        ...customization.options,
      }
    }

    // Update the current chart
    setCurrentChart(updatedChart)

    // Send the updated chart to the parent component
    onResponse({
      chart: updatedChart,
      insights: data.insights,
      statistics: data.statistics,
      data: data.data,
    })

    // Show success toast
    toast({
      title: "Chart Updated",
      description: "Your customization changes have been applied",
    })
  }

  const downloadChartWithHTML5 = () => {
    try {
      setIsExporting(true)

      // Find the chart container using the ref
      const chartContainer = chartRef.current

      if (!chartContainer) {
        console.error("Chart container ref is null:", chartRef)
        throw new Error("Chart container not found")
      }

      console.log("Found chart container:", chartContainer)

      // Add a small delay to ensure chart is fully rendered
      setTimeout(() => {
        // Set up html2canvas with improved options
        html2canvas(chartContainer, {
          scale: 2,
          backgroundColor: null,
          allowTaint: true,
          useCORS: true,
          logging: true,
          onclone: (clonedDoc) => {
            console.log("Cloned document for export")
            return clonedDoc
          },
        })
          .then((canvas) => {
            // Convert canvas to data URL
            const imageData = canvas.toDataURL("image/png")

            // Create and trigger download
            const downloadButton = document.createElement("a")
            downloadButton.href = imageData
            downloadButton.download = `${chartToRender.title || "chart"}-${new Date().toISOString().slice(0, 10)}.png`
            document.body.appendChild(downloadButton)
            downloadButton.click()
            document.body.removeChild(downloadButton)

            toast({
              title: "Chart downloaded",
              description: "Your chart has been saved successfully.",
            })
            setIsExporting(false)
          })
          .catch((err) => {
            console.error("Error generating chart image:", err)
            toast({
              title: "Download failed",
              description: "Could not generate chart image. Please try again.",
              variant: "destructive",
            })
            setIsExporting(false)
          })
      }, 500) // Wait 500ms for chart to render fully
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download chart. Please try again.",
        variant: "destructive",
      })
      setIsExporting(false)
    }
  }

  // Function to handle chart export (dummy function for now)
  const handleExportChart = () => {
    console.log("Export chart function called (dummy).")
  }

  // Function to get the appropriate chart icon
  const getChartIcon = (type: string) => {
    switch (type) {
      case "bar":
        return <BarChart2 className="h-4 w-4" />
      case "line":
        return <LineChartIcon className="h-4 w-4" />
      case "pie":
        return <PieChartIcon className="h-4 w-4" />
      case "scatter":
        return <ScatterChartIcon className="h-4 w-4" />
      case "boxplot":
        return <BoxSelect className="h-4 w-4" />
      case "heatmap":
        return <Grid3X3 className="h-4 w-4" />
      default:
        return <BarChart2 className="h-4 w-4" />
    }
  }

  // Function to get a simple explanation of the chart type
  const getChartExplanation = (type: string) => {
    switch (type) {
      case "bar":
        return "Bar charts compare values across categories. Taller bars represent higher values."
      case "line":
        return "Line charts show trends over time or sequences. Rising lines indicate increasing values."
      case "pie":
        return "Pie charts show proportions of a whole. Larger slices represent higher percentages."
      case "scatter":
        return "Scatter plots show relationships between two variables. Patterns indicate correlations."
      case "boxplot":
        return "Box plots show distribution statistics including median, quartiles, and outliers."
      case "heatmap":
        return "Heatmaps use color intensity to show values across two categories."
      default:
        return ""
    }
  }

  // Render loading state
  if (isLoading) {
    return (
      <Card className="col-span-3 h-full">
        <CardHeader>
          <CardTitle className="text-xl">Analyzing Data...</CardTitle>
          <CardDescription>Please wait while we process your query</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">This may take a few moments</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render error state
  if (error || !data || !data.chart) {
    return (
      <Card className="col-span-3 h-full">
        <CardHeader>
          <CardTitle className="text-xl">Visualization</CardTitle>
          <CardDescription>No visualization available</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error || "No visualization data available. Try asking a different question."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Format insights for display
  const formattedInsights =
    data.insights?.map((insight: string) => ({
      type: "info" as const,
      title: "Insight",
      description: insight,
    })) || []

  // Add a tip about the chart type
  const chartTypeTip = {
    type: "info" as const,
    title: "Chart Type",
    description: getChartExplanation(data.chart.type),
  }

  // Use the current chart for rendering
  const chartToRender = currentChart || data.chart

  // Render the visualization
  return (
    <Card className="col-span-3 h-full flex flex-col overflow-auto shadow-sm border">
      <CardHeader className="pb-2 flex-shrink-0 bg-background/95 backdrop-blur-sm sticky top-0 z-10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getChartIcon(chartToRender.type)}
            <div>
              <CardTitle className="text-xl">{chartToRender.title || "Data Visualization"}</CardTitle>
              <CardDescription>{chartToRender.description || "Analysis of your data"}</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadChartWithHTML5}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download Chart</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="flex-shrink-0 sticky top-0 z-10 bg-background px-4 pt-2 -mx-4 -mt-4 border-b w-[calc(100%+2rem)]">
            <TabsTrigger value="chart" className="flex items-center gap-1">
              {getChartIcon(chartToRender.type)}
              <span>Chart</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-1">
              <Lightbulb className="h-4 w-4" />
              <span>Insights</span>
              {formattedInsights.length > 0 && (
                <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {formattedInsights.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-1">
              <BarChart2 className="h-4 w-4" />
              <span>Statistics</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-1">
              <Grid3X3 className="h-4 w-4" />
              <span>Data</span>
            </TabsTrigger>
            <TabsTrigger value="customize" className="flex items-center gap-1">
              <Palette className="h-4 w-4" />
              <span>Advanced Customize</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="chart" className="flex-1 overflow-auto p-4 border-0">
            <div className="mb-2 text-sm text-muted-foreground">
              <TermTooltip term={chartToRender.type}>
                {chartToRender.type.charAt(0).toUpperCase() + chartToRender.type.slice(1)} chart
              </TermTooltip>
              {chartToRender.xLabel && chartToRender.yLabel && (
                <span>
                  {" "}
                  showing {chartToRender.yLabel} by {chartToRender.xLabel}
                </span>
              )}
            </div>
            <div
              ref={chartRef}
              className="w-full chart-container visualization-container relative min-h-[450px]"
              style={{ height: "auto", minHeight: "450px" }}
              id="chart-container"
              data-testid="chart-container"
            >
              {chartToRender.type === "bar" && <BarChart data={chartToRender} />}
              {chartToRender.type === "line" && <LineChart data={chartToRender} />}
              {chartToRender.type === "pie" && <PieChart data={chartToRender} />}
              {chartToRender.type === "scatter" && <ScatterChart data={chartToRender} />}
              {chartToRender.type === "boxplot" && <BoxPlot data={chartToRender} />}
              {chartToRender.type === "heatmap" && <HeatMap data={chartToRender} />}
            </div>
            <div className="h-8"></div> {/* Bottom padding */}
          </TabsContent>
          <TabsContent value="insights" className="flex-1 overflow-auto p-4">
            <InsightsList insights={[chartTypeTip, ...formattedInsights]} />
            <div className="h-8"></div> {/* Bottom padding */}
          </TabsContent>
          <TabsContent value="statistics" className="flex-1 overflow-auto p-4">
            <StatisticsPanel statistics={data.statistics || {}} />
            <div className="h-8"></div> {/* Bottom padding */}
          </TabsContent>
          <TabsContent value="data" className="flex-1 overflow-auto p-4">
            <DataTable data={data.data || []} />
            <div className="h-8"></div> {/* Bottom padding */}
          </TabsContent>
          <TabsContent value="customize" className="flex-1 overflow-auto p-4">
            <ChartCustomizationPanel
              chart={currentChart || data.chart}
              onCustomizationApply={handleCustomizationApply}
              onExport={handleExportChart}
            />
            <div className="h-8"></div> {/* Bottom padding */}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

