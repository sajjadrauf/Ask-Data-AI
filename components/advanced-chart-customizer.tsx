"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Palette, Type, Check, Loader2 } from "lucide-react"
import { ColorPicker } from "@/components/color-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface ChartCustomizationPanelProps {
  chart: any
  onCustomizationApply: (customization: any) => void
  onExport: (exportConfig?: any) => void
}

export default function ChartCustomizationPanel({
  chart,
  onCustomizationApply,
  onExport,
}: ChartCustomizationPanelProps) {
  // Basic settings
  const [title, setTitle] = useState(chart?.title || "")
  const [subtitle, setSubtitle] = useState(chart?.description || "")
  const [xLabel, setXLabel] = useState(chart?.xLabel || "")
  const [yLabel, setYLabel] = useState(chart?.yLabel || "")

  // Color settings
  const [colorScheme, setColorScheme] = useState("default")
  const [customColors, setCustomColors] = useState<Record<number, string>>({})

  // Apply changes feedback
  const [isApplying, setIsApplying] = useState(false)
  const [applied, setApplied] = useState(false)

  const { toast } = useToast()

  // Update local state when chart changes
  useEffect(() => {
    setTitle(chart?.title || "")
    setSubtitle(chart?.description || "")
    setXLabel(chart?.xLabel || "")
    setYLabel(chart?.yLabel || "")
  }, [chart])

  // Apply title and labels
  const handleApplyLabels = () => {
    setIsApplying(true)
    setApplied(false)

    // Apply the changes
    onCustomizationApply({
      title,
      description: subtitle,
      xLabel,
      yLabel,
    })

    // Show applying state briefly
    setTimeout(() => {
      setIsApplying(false)
      setApplied(true)

      // Reset applied state after a moment
      setTimeout(() => {
        setApplied(false)
      }, 2000)
    }, 500)
  }

  // Apply color to a specific dataset
  const handleColorChange = (index: number, color: string) => {
    setCustomColors((prev) => ({
      ...prev,
      [index]: color,
    }))

    onCustomizationApply({
      colors: {
        ...customColors,
        [index]: color,
      },
    })
  }

  // Apply a predefined color scheme
  const handleColorSchemeChange = (scheme: string) => {
    setColorScheme(scheme)

    let colors: Record<number, string> = {}

    // Define color schemes
    switch (scheme) {
      case "blue":
        colors = {
          0: "#36A2EB",
          1: "#5DADE2",
          2: "#85C1E9",
        }
        break
      case "green":
        colors = {
          0: "#4BC0C0",
          1: "#66D9B8",
          2: "#80DEEA",
        }
        break
      case "purple":
        colors = {
          0: "#9966FF",
          1: "#AB7DF6",
          2: "#BB93F4",
        }
        break
      case "rainbow":
        colors = {
          0: "#FF6384",
          1: "#FF9F40",
          2: "#FFCD56",
          3: "#4BC0C0",
          4: "#36A2EB",
          5: "#9966FF",
        }
        break
      case "pastel":
        colors = {
          0: "#FFB3BA",
          1: "#FFDFBA",
          2: "#FFFFBA",
          3: "#BAFFC9",
          4: "#BAE1FF",
          5: "#E2BAFF",
        }
        break
      default:
        // Default colors
        colors = {}
        break
    }

    setCustomColors(colors)
    onCustomizationApply({ colors })
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
              <span>Text</span>
            </TabsTrigger>
            <TabsTrigger value="colors" className="flex items-center gap-1">
              <Palette className="h-4 w-4" />
              <span>Colors</span>
            </TabsTrigger>
          </TabsList>

          {/* TEXT TAB */}
          <TabsContent value="labels" className="p-4 space-y-4">
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
              <Label htmlFor="chart-subtitle">Chart Subtitle</Label>
              <Input
                id="chart-subtitle"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Enter chart subtitle"
              />
            </div>

            {chart?.type !== "pie" && (
              <>
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
              </>
            )}

            <Button
              onClick={handleApplyLabels}
              className={`w-full transition-all duration-300 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] active:bg-primary/80 ${
                applied ? "bg-green-600 hover:bg-green-700" : ""
              }`}
              disabled={isApplying}
            >
              {isApplying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Applying...</span>
                </>
              ) : applied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  <span>Applied!</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  <span>Apply Changes</span>
                </>
              )}
            </Button>
          </TabsContent>

          {/* COLORS TAB */}
          <TabsContent value="colors" className="p-4 space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="mb-2 block">Color Scheme</Label>
                <Select value={colorScheme} onValueChange={handleColorSchemeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a color scheme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                    <SelectItem value="rainbow">Rainbow</SelectItem>
                    <SelectItem value="pastel">Pastel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label className="mb-2 block">Custom Dataset Colors</Label>
                {getDatasetNames().map((dataset) => (
                  <div key={dataset.index} className="flex items-center justify-between mb-2">
                    <span className="text-sm">{dataset.name}</span>
                    <div className="flex gap-2">
                      <ColorPicker
                        color={
                          customColors[dataset.index] ||
                          (typeof chart?.data?.datasets?.[dataset.index]?.backgroundColor === "string"
                            ? chart?.data?.datasets?.[dataset.index]?.backgroundColor
                            : "#4f46e5")
                        }
                        onChange={(color) => handleColorChange(dataset.index, color)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

