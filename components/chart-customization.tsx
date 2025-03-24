"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ColorPicker } from "@/components/color-picker"
import { Palette, Type, Download } from "lucide-react"

interface ChartCustomizationProps {
  chart: any
  customization: any
  onCustomizationChange: (customization: any) => void
}

export function ChartCustomization({ chart, customization, onCustomizationChange }: ChartCustomizationProps) {
  // Add safety check for chart and chart.data
  if (!chart || !chart.data) {
    return (
      <Card className="h-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-md">Chart Customization</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-sm text-muted-foreground">No chart data available for customization</div>
        </CardContent>
      </Card>
    )
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCustomizationChange({ title: e.target.value })
  }

  const handleXLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCustomizationChange({ xLabel: e.target.value })
  }

  const handleYLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCustomizationChange({ yLabel: e.target.value })
  }

  const handleColorChange = (index: number, color: string) => {
    const colors = { ...(customization.colors || {}) }
    colors[index] = color
    onCustomizationChange({ colors })
  }

  const handleExport = () => {
    // In a real app, this would generate and download the chart as an image
    alert("Chart export functionality would be implemented here")
  }

  return (
    <Card className="h-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-md">Chart Customization</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <Accordion type="multiple" defaultValue={["appearance", "labels"]}>
          <AccordionItem value="labels">
            <AccordionTrigger className="flex items-center gap-2 text-sm">
              <Type className="h-4 w-4" />
              <span>Labels</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="chart-title">Chart Title</Label>
                <Input
                  id="chart-title"
                  value={customization.title || chart.title || ""}
                  onChange={handleTitleChange}
                  placeholder="Enter chart title"
                />
              </div>
              {chart.type !== "pie" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="x-axis-label">X-Axis Label</Label>
                    <Input
                      id="x-axis-label"
                      value={customization.xLabel || chart.xLabel || ""}
                      onChange={handleXLabelChange}
                      placeholder="Enter x-axis label"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="y-axis-label">Y-Axis Label</Label>
                    <Input
                      id="y-axis-label"
                      value={customization.yLabel || chart.yLabel || ""}
                      onChange={handleYLabelChange}
                      placeholder="Enter y-axis label"
                    />
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="appearance">
            <AccordionTrigger className="flex items-center gap-2 text-sm">
              <Palette className="h-4 w-4" />
              <span>Appearance</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Chart Colors</Label>
                <div className="grid grid-cols-1 gap-4">
                  {chart.data && chart.data.datasets && chart.data.datasets.length > 0 ? (
                    chart.data.datasets.map((dataset: any, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <Label className="flex-1 truncate">{dataset.label || `Series ${index + 1}`}:</Label>
                        <ColorPicker
                          color={
                            customization.colors?.[index] || dataset.backgroundColor || dataset.borderColor || "#4f46e5"
                          }
                          onChange={(color) => handleColorChange(index, color)}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No datasets available</div>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="flex justify-end mt-4">
          <Button variant="outline" className="flex items-center gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            <span>Export Chart</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

