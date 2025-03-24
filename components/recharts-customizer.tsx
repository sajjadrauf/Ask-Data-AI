"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { ColorPicker } from "@/components/color-picker"
import { Check, Download, Palette, Type, LineChart, BarChart2, PieChart, ScatterChart } from "lucide-react"
import { toPng, toJpeg } from "html-to-image"

interface RechartsCustomizerProps {
  chartRef: React.RefObject<HTMLDivElement>
  chartConfig: any
  onConfigChange: (config: any) => void
}

export function RechartsCustomizer({ chartRef, chartConfig, onConfigChange }: RechartsCustomizerProps) {
  // State for all customization options
  const [title, setTitle] = useState(chartConfig.title || "")
  const [description, setDescription] = useState(chartConfig.description || "")
  const [xLabel, setXLabel] = useState(chartConfig.xLabel || "")
  const [yLabel, setYLabel] = useState(chartConfig.yLabel || "")

  // Chart type options
  const [chartType, setChartType] = useState(chartConfig.type || "bar")

  // Color options
  const [colorPalette, setColorPalette] = useState("default")
  const [customColors, setCustomColors] = useState<string[]>(chartConfig.colors || [])

  // Animation options
  const [animationDuration, setAnimationDuration] = useState(1500)
  const [enableAnimation, setEnableAnimation] = useState(true)

  // Grid options
  const [showGrid, setShowGrid] = useState(true)
  const [gridDashArray, setGridDashArray] = useState("3 3")

  // Legend options
  const [showLegend, setShowLegend] = useState(true)
  const [legendPosition, setLegendPosition] = useState("bottom")

  // Export options
  const [exportFormat, setExportFormat] = useState("png")
  const [exportQuality, setExportQuality] = useState(0.95)
  const [exportFileName, setExportFileName] = useState(title.replace(/\s+/g, "_").toLowerCase() || "chart")
  const [isExporting, setIsExporting] = useState(false)

  // Apply text changes
  const handleApplyText = () => {
    onConfigChange({
      ...chartConfig,
      title,
      description,
      xLabel,
      yLabel,
    })
  }

  // Apply chart type change
  const handleChartTypeChange = (type: string) => {
    setChartType(type)
    onConfigChange({
      ...chartConfig,
      type,
    })
  }

  // Apply color changes
  const handleColorChange = (index: number, color: string) => {
    const newColors = [...customColors]
    newColors[index] = color
    setCustomColors(newColors)

    onConfigChange({
      ...chartConfig,
      colors: newColors,
    })
  }

  // Apply color palette
  const handleColorPaletteChange = (palette: string) => {
    setColorPalette(palette)

    let colors: string[] = []
    switch (palette) {
      case "blue":
        colors = ["#1d4ed8", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"]
        break
      case "green":
        colors = ["#15803d", "#22c55e", "#4ade80", "#86efac", "#bbf7d0"]
        break
      case "purple":
        colors = ["#7e22ce", "#a855f7", "#c084fc", "#d8b4fe", "#e9d5ff"]
        break
      case "warm":
        colors = ["#b91c1c", "#ef4444", "#f97316", "#f59e0b", "#eab308"]
        break
      case "cool":
        colors = ["#0e7490", "#06b6d4", "#22d3ee", "#67e8f9", "#a5f3fc"]
        break
      case "monochrome":
        colors = ["#18181b", "#27272a", "#3f3f46", "#52525b", "#71717a"]
        break
      default:
        colors = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]
    }

    setCustomColors(colors)
    onConfigChange({
      ...chartConfig,
      colors,
    })
  }

  // Apply animation settings
  const handleAnimationChange = () => {
    onConfigChange({
      ...chartConfig,
      animation: {
        enabled: enableAnimation,
        duration: animationDuration,
      },
    })
  }

  // Apply grid settings
  const handleGridChange = () => {
    onConfigChange({
      ...chartConfig,
      grid: {
        show: showGrid,
        dashArray: gridDashArray,
      },
    })
  }

  // Apply legend settings
  const handleLegendChange = () => {
    onConfigChange({
      ...chartConfig,
      legend: {
        show: showLegend,
        position: legendPosition,
      },
    })
  }

  // Handle export
  const handleExport = async () => {
    if (!chartRef.current) return

    setIsExporting(true)
    try {
      const dataUrl =
        exportFormat === "png"
          ? await toPng(chartRef.current, { quality: exportQuality })
          : await toJpeg(chartRef.current, { quality: exportQuality })

      // Create download link
      const link = document.createElement("a")
      link.download = `${exportFileName}.${exportFormat}`
      link.href = dataUrl
      link.click()
    } catch (error) {
      console.error("Error exporting chart:", error)
    } finally {
      setIsExporting(false)
    }
  }

  // Get dataset names for color customization
  const getDatasetNames = () => {
    if (!chartConfig?.data?.datasets) return []

    return chartConfig.data.datasets.map((dataset: any, index: number) => ({
      name: dataset.label || `Series ${index + 1}`,
      index,
    }))
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-md">Chart Customization</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="text">
          <TabsList className="w-full">
            <TabsTrigger value="text" className="flex items-center gap-1">
              <Type className="h-4 w-4" />
              <span>Text</span>
            </TabsTrigger>
            <TabsTrigger value="chart" className="flex items-center gap-1">
              <BarChart2 className="h-4 w-4" />
              <span>Chart Type</span>
            </TabsTrigger>
            <TabsTrigger value="colors" className="flex items-center gap-1">
              <Palette className="h-4 w-4" />
              <span>Colors</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </TabsTrigger>
          </TabsList>

          {/* TEXT TAB */}
          <TabsContent value="text" className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chart-title">Chart Title</Label>
              <Input
                id="chart-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter chart title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chart-description">Chart Description</Label>
              <Input
                id="chart-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter chart description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="x-axis-label">X-Axis Label</Label>
              <Input
                id="x-axis-label"
                value={xLabel}
                onChange={(e) => setXLabel(e.target.value)}
                placeholder="Enter x-axis label"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="y-axis-label">Y-Axis Label</Label>
              <Input
                id="y-axis-label"
                value={yLabel}
                onChange={(e) => setYLabel(e.target.value)}
                placeholder="Enter y-axis label"
              />
            </div>

            <Button
              onClick={handleApplyText}
              className="w-full transition-all duration-300 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Check className="h-4 w-4 mr-2" />
              Apply Text Changes
            </Button>
          </TabsContent>

          {/* CHART TYPE TAB */}
          <TabsContent value="chart" className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={chartType === "bar" ? "default" : "outline"}
                className="flex flex-col items-center justify-center h-24 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => handleChartTypeChange("bar")}
              >
                <BarChart2 className="h-8 w-8 mb-2" />
                <span>Bar Chart</span>
              </Button>

              <Button
                variant={chartType === "line" ? "default" : "outline"}
                className="flex flex-col items-center justify-center h-24 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => handleChartTypeChange("line")}
              >
                <LineChart className="h-8 w-8 mb-2" />
                <span>Line Chart</span>
              </Button>

              <Button
                variant={chartType === "pie" ? "default" : "outline"}
                className="flex flex-col items-center justify-center h-24 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => handleChartTypeChange("pie")}
              >
                <PieChart className="h-8 w-8 mb-2" />
                <span>Pie Chart</span>
              </Button>

              <Button
                variant={chartType === "scatter" ? "default" : "outline"}
                className="flex flex-col items-center justify-center h-24 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => handleChartTypeChange("scatter")}
              >
                <ScatterChart className="h-8 w-8 mb-2" />
                <span>Scatter Chart</span>
              </Button>

              <Button
                variant={chartType === "area" ? "default" : "outline"}
                className="flex flex-col items-center justify-center h-24 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => handleChartTypeChange("area")}
              >
                <LineChart className="h-8 w-8 mb-2" />
                <span>Area Chart</span>
              </Button>
            </div>

            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-animation">Enable Animation</Label>
                <Switch id="enable-animation" checked={enableAnimation} onCheckedChange={setEnableAnimation} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="animation-duration">Animation Duration (ms)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="animation-duration"
                    min={500}
                    max={3000}
                    step={100}
                    value={[animationDuration]}
                    onValueChange={(value) => setAnimationDuration(value[0])}
                    className="flex-1"
                    disabled={!enableAnimation}
                  />
                  <span className="text-sm w-12 text-center">{animationDuration}</span>
                </div>
              </div>

              <Button
                onClick={handleAnimationChange}
                className="w-full transition-all duration-300 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Check className="h-4 w-4 mr-2" />
                Apply Animation Settings
              </Button>

              <div className="flex items-center justify-between mt-4">
                <Label htmlFor="show-grid">Show Grid Lines</Label>
                <Switch id="show-grid" checked={showGrid} onCheckedChange={setShowGrid} />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-legend">Show Legend</Label>
                <Switch id="show-legend" checked={showLegend} onCheckedChange={setShowLegend} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="legend-position">Legend Position</Label>
                <Select value={legendPosition} onValueChange={setLegendPosition}>
                  <SelectTrigger id="legend-position">
                    <SelectValue placeholder="Select legend position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleLegendChange}
                className="w-full transition-all duration-300 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Check className="h-4 w-4 mr-2" />
                Apply Display Settings
              </Button>
            </div>
          </TabsContent>

          {/* COLORS TAB */}
          <TabsContent value="colors" className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="mb-2 block">Color Palette</Label>
              <Select value={colorPalette} onValueChange={handleColorPaletteChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a color palette" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="purple">Purple</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cool">Cool</SelectItem>
                  <SelectItem value="monochrome">Monochrome</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <Label className="mb-2 block">Custom Series Colors</Label>
              {getDatasetNames().map((dataset) => (
                <div key={dataset.index} className="flex items-center justify-between mb-2">
                  <span className="text-sm">{dataset.name}</span>
                  <div className="flex gap-2">
                    <ColorPicker
                      color={
                        customColors[dataset.index] ||
                        chartConfig?.data?.datasets?.[dataset.index]?.backgroundColor ||
                        "#4f46e5"
                      }
                      onChange={(color) => handleColorChange(dataset.index, color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* EXPORT TAB */}
          <TabsContent value="export" className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="export-format">Export Format</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger id="export-format">
                  <SelectValue placeholder="Select export format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG Image</SelectItem>
                  <SelectItem value="jpeg">JPEG Image</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="export-quality">Image Quality</Label>
              <div className="flex items-center gap-2">
                <Slider
                  id="export-quality"
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  value={[exportQuality]}
                  onValueChange={(value) => setExportQuality(value[0])}
                  className="flex-1"
                />
                <span className="text-sm w-12 text-center">{(exportQuality * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="export-filename">File Name</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="export-filename"
                  value={exportFileName}
                  onChange={(e) => setExportFileName(e.target.value)}
                  placeholder="chart_export"
                />
                <span className="text-sm text-muted-foreground">.{exportFormat}</span>
              </div>
            </div>

            <Button
              className="w-full mt-4 flex items-center justify-center gap-2 transition-all duration-300 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? <span className="animate-spin mr-2">⏳</span> : <Download className="h-4 w-4 mr-2" />}
              <span>{isExporting ? "Exporting..." : "Download Chart"}</span>
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

