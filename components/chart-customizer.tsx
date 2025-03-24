"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Palette, Type, Download } from "lucide-react"
import { ColorPicker } from "@/components/color-picker"

interface ChartCustomizerProps {
  chart: any
  onCustomizationChange: (customization: any) => void
  onExport: () => void
}

export function ChartCustomizer({ chart, onCustomizationChange, onExport }: ChartCustomizerProps) {
  const [title, setTitle] = useState(chart?.title || "")
  const [xLabel, setXLabel] = useState(chart?.xLabel || "")
  const [yLabel, setYLabel] = useState(chart?.yLabel || "")

  const handleTitleChange = () => {
    if (title !== chart?.title) {
      onCustomizationChange({
        type: "title",
        value: title,
      })
    }
  }

  const handleXLabelChange = () => {
    if (xLabel !== chart?.xLabel) {
      onCustomizationChange({
        type: "label",
        axis: "x",
        value: xLabel,
      })
    }
  }

  const handleYLabelChange = () => {
    if (yLabel !== chart?.yLabel) {
      onCustomizationChange({
        type: "label",
        axis: "y",
        value: yLabel,
      })
    }
  }

  const handleColorChange = (element: string, color: string) => {
    onCustomizationChange({
      type: "color",
      element,
      color,
    })
  }

  // Get dataset names for color customization
  const getDatasetNames = () => {
    if (!chart?.data?.datasets) return []

    return chart.data.datasets.map((dataset: any, index: number) => ({
      name: dataset.label || `Dataset ${index + 1}`,
      index,
    }))
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-md">Chart Customization</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="labels">
          <TabsList className="w-full">
            <TabsTrigger value="labels" className="flex items-center gap-1">
              <Type className="h-4 w-4" />
              <span>Labels</span>
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

          <TabsContent value="labels" className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chart-title">Chart Title</Label>
              <div className="flex gap-2">
                <Input
                  id="chart-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter chart title"
                />
                <Button size="sm" onClick={handleTitleChange}>
                  Apply
                </Button>
              </div>
            </div>

            {chart?.type !== "pie" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="x-axis-label">X-Axis Label</Label>
                  <div className="flex gap-2">
                    <Input
                      id="x-axis-label"
                      value={xLabel}
                      onChange={(e) => setXLabel(e.target.value)}
                      placeholder="Enter x-axis label"
                    />
                    <Button size="sm" onClick={handleXLabelChange}>
                      Apply
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="y-axis-label">Y-Axis Label</Label>
                  <div className="flex gap-2">
                    <Input
                      id="y-axis-label"
                      value={yLabel}
                      onChange={(e) => setYLabel(e.target.value)}
                      placeholder="Enter y-axis label"
                    />
                    <Button size="sm" onClick={handleYLabelChange}>
                      Apply
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="colors" className="p-4 space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Chart Colors</Label>
                {getDatasetNames().map((dataset) => (
                  <div key={dataset.index} className="flex items-center justify-between mb-2">
                    <span className="text-sm">{dataset.name}</span>
                    <div className="flex gap-2">
                      <ColorPicker
                        color={chart?.data?.datasets?.[dataset.index]?.backgroundColor || "#4f46e5"}
                        onChange={(color) => handleColorChange(`dataset ${dataset.index}`, color)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t">
                <Label className="mb-2 block">Quick Colors</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleColorChange("all datasets", "blue")}>
                    Blue Theme
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleColorChange("all datasets", "green")}>
                    Green Theme
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleColorChange("all datasets", "purple")}>
                    Purple Theme
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleColorChange("all datasets", "orange")}>
                    Orange Theme
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="export" className="p-4 space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-4">
                Export your chart as an image file that you can download and share.
              </p>

              <Button className="w-full flex items-center justify-center gap-2" onClick={onExport} data-export-chart>
                <Download className="h-4 w-4" />
                <span>Download as PNG</span>
              </Button>

              <p className="text-xs text-muted-foreground mt-4">
                Tip: You can also type "export chart" in the chat to download the current visualization.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

