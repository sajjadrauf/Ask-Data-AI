"use client"

import React, { useState } from "react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Share } from "lucide-react"
import { toPng, toJpeg } from "html-to-image"

interface RechartsVisualizationProps {
  data: any
  type: string
  title: string
  description?: string
  xLabel?: string
  yLabel?: string
  colors?: string[]
  onExport?: (dataUrl: string) => void
}

export function RechartsVisualization({
  data,
  type,
  title,
  description,
  xLabel,
  yLabel,
  colors = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899"],
  onExport,
}: RechartsVisualizationProps) {
  const [isExporting, setIsExporting] = useState(false)
  const chartRef = React.useRef<HTMLDivElement>(null)

  // Function to handle chart export
  const handleExport = async (format: "png" | "jpeg" = "png") => {
    if (!chartRef.current) return

    setIsExporting(true)
    try {
      const dataUrl =
        format === "png"
          ? await toPng(chartRef.current, { quality: 0.95 })
          : await toJpeg(chartRef.current, { quality: 0.95 })

      // If onExport callback is provided, use it
      if (onExport) {
        onExport(dataUrl)
      } else {
        // Otherwise download directly
        const link = document.createElement("a")
        link.download = `${title.replace(/\s+/g, "_").toLowerCase()}.${format}`
        link.href = dataUrl
        link.click()
      }
    } catch (error) {
      console.error("Error exporting chart:", error)
    } finally {
      setIsExporting(false)
    }
  }

  // Prepare data for Recharts
  const chartData = data?.data?.datasets
    ? data.data.labels.map((label: string, index: number) => {
        const item: any = { name: label }
        data.data.datasets.forEach((dataset: any, datasetIndex: number) => {
          item[dataset.label || `Series ${datasetIndex + 1}`] = dataset.data[index]
        })
        return item
      })
    : []

  // Get dataset names for legend
  const datasetNames = data?.data?.datasets?.map((dataset: any) => dataset.label || "Series") || []

  // Render appropriate chart based on type
  const renderChart = () => {
    switch (type) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" label={{ value: xLabel, position: "insideBottom", offset: -10 }} />
              <YAxis label={{ value: yLabel, angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              {datasetNames.map((name: string, index: number) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={name}
                  stroke={colors[index % colors.length]}
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                  animationDuration={1500}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" label={{ value: xLabel, position: "insideBottom", offset: -10 }} />
              <YAxis label={{ value: yLabel, angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              {datasetNames.map((name: string, index: number) => (
                <Bar key={index} dataKey={name} fill={colors[index % colors.length]} animationDuration={1500} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )

      case "pie":
        // Transform data for pie chart
        const pieData = datasetNames.map((name: string, index: number) => ({
          name,
          value: data.data.datasets[0].data[index],
        }))

        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                animationDuration={1500}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}`, "Value"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )

      case "scatter":
        // Transform data for scatter chart
        const scatterData = datasetNames.map((name: string, index: number) => {
          return {
            name,
            data: chartData.map((item: any) => ({
              x: item.name,
              y: item[name],
            })),
          }
        })

        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name={xLabel}
                label={{ value: xLabel, position: "insideBottom", offset: -10 }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name={yLabel}
                label={{ value: yLabel, angle: -90, position: "insideLeft" }}
              />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Legend />
              {scatterData.map((s, index) => (
                <Scatter
                  key={index}
                  name={s.name}
                  data={s.data}
                  fill={colors[index % colors.length]}
                  animationDuration={1500}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        )

      case "area":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" label={{ value: xLabel, position: "insideBottom", offset: -10 }} />
              <YAxis label={{ value: yLabel, angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              {datasetNames.map((name: string, index: number) => (
                <Area
                  key={index}
                  type="monotone"
                  dataKey={name}
                  stroke={colors[index % colors.length]}
                  fill={`${colors[index % colors.length]}80`} // Add transparency
                  stackId="1"
                  animationDuration={1500}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )

      default:
        return (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            Unsupported chart type: {type}
          </div>
        )
    }
  }

  return (
    <Card className="w-full shadow-sm" ref={chartRef}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{title}</CardTitle>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 transition-all duration-300 hover:bg-primary/10 hover:scale-[1.05] active:scale-[0.98]"
              onClick={() => handleExport("png")}
              disabled={isExporting}
            >
              {isExporting ? <span className="animate-spin mr-1">⏳</span> : <Download className="h-4 w-4" />}
              <span>{isExporting ? "Exporting..." : "Export"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 transition-all duration-300 hover:bg-primary/10 hover:scale-[1.05] active:scale-[0.98]"
            >
              <Share className="h-4 w-4" />
              <span>Share</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{renderChart()}</CardContent>
    </Card>
  )
}

