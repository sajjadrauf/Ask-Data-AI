"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Palette,
  Type,
  Download,
  Check,
  Sliders,
  LineChart,
  BarChartIcon,
  PieChartIcon,
  Grid,
  Layers,
  Paintbrush,
  TextCursorInput,
} from "lucide-react"
import { ColorPicker } from "@/components/color-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface ChartCustomizationPanelProps {
  chart: any
  onCustomizationApply: (customization: any) => void
  onExport: () => void
}

export function ChartCustomizationPanel({ chart, onCustomizationApply, onExport }: ChartCustomizationPanelProps) {
  // Basic settings
  const [title, setTitle] = useState(chart?.title || "")
  const [titleFont, setTitleFont] = useState("Inter")
  const [titleSize, setTitleSize] = useState(18)
  const [titleColor, setTitleColor] = useState("#000000")
  const [titleAlign, setTitleAlign] = useState("center")

  const [subtitle, setSubtitle] = useState(chart?.description || "")
  const [xLabel, setXLabel] = useState(chart?.xLabel || "")
  const [yLabel, setYLabel] = useState(chart?.yLabel || "")

  // Legend settings
  const [legendPosition, setLegendPosition] = useState("top")
  const [showLegend, setShowLegend] = useState(true)
  const [legendAlign, setLegendAlign] = useState("center")

  // Grid settings
  const [showGridLines, setShowGridLines] = useState(true)
  const [gridLineColor, setGridLineColor] = useState("#e2e8f0")
  const [gridLineWidth, setGridLineWidth] = useState(1)

  // Axis settings
  const [xAxisTickRotation, setXAxisTickRotation] = useState(0)
  const [yAxisMin, setYAxisMin] = useState("")
  const [yAxisMax, setYAxisMax] = useState("")
  const [xAxisLabelColor, setXAxisLabelColor] = useState("#64748b")
  const [yAxisLabelColor, setYAxisLabelColor] = useState("#64748b")

  // Animation settings
  const [enableAnimations, setEnableAnimations] = useState(true)
  const [animationDuration, setAnimationDuration] = useState(1000)
  const [animationType, setAnimationType] = useState("easeOutQuart")

  // Data point settings
  const [pointSize, setPointSize] = useState(3)
  const [barThickness, setBarThickness] = useState(0.9) // For bar charts
  const [lineThickness, setLineThickness] = useState(2) // For line charts

  // Color scheme
  const [colorScheme, setColorScheme] = useState("default")
  const [customColors, setCustomColors] = useState<Record<number, string>>({})
  const [backgroundColor, setBackgroundColor] = useState("transparent")

  // Export settings
  const [exportFormat, setExportFormat] = useState("png")
  const [exportQuality, setExportQuality] = useState("high")
  const [exportWidth, setExportWidth] = useState(1200)
  const [exportHeight, setExportHeight] = useState(800)
  const [exportFileName, setExportFileName] = useState(chart?.title?.replace(/\s+/g, "_").toLowerCase() || "chart")

  // Update local state when chart changes
  useEffect(() => {
    setTitle(chart?.title || "")
    setSubtitle(chart?.description || "")
    setXLabel(chart?.xLabel || "")
    setYLabel(chart?.yLabel || "")
  }, [chart])

  // Apply title and labels
  const handleApplyLabels = () => {
    onCustomizationApply({
      title,
      description: subtitle,
      xLabel,
      yLabel,
      options: {
        plugins: {
          title: {
            display: !!title,
            text: title,
            font: {
              family: titleFont,
              size: titleSize,
              weight: "bold",
            },
            color: titleColor,
            align: titleAlign,
          },
          subtitle: {
            display: !!subtitle,
            text: subtitle,
            font: {
              family: titleFont,
              size: titleSize - 4,
              weight: "normal",
            },
            color: titleColor,
            padding: {
              bottom: 10,
            },
          },
        },
      },
    })
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
          3: "#AED6F1",
          4: "#D6EAF8",
        }
        break
      case "green":
        colors = {
          0: "#4BC0C0",
          1: "#66D9B8",
          2: "#80DEEA",
          3: "#A3E4D7",
          4: "#D1F2EB",
        }
        break
      case "purple":
        colors = {
          0: "#9966FF",
          1: "#AB7DF6",
          2: "#BB93F4",
          3: "#CCABF5",
          4: "#E8DAEF",
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
      case "monochrome":
        colors = {
          0: "#2C3E50",
          1: "#34495E",
          2: "#5D6D7E",
          3: "#85929E",
          4: "#ABB2B9",
          5: "#D5D8DC",
        }
        break
      case "warm":
        colors = {
          0: "#FF5733",
          1: "#FF8D33",
          2: "#FFC300",
          3: "#DAF7A6",
          4: "#C70039",
          5: "#900C3F",
        }
        break
      case "cool":
        colors = {
          0: "#0077B6",
          1: "#00B4D8",
          2: "#90E0EF",
          3: "#CAF0F8",
          4: "#023E8A",
          5: "#03045E",
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

  // Apply chart options
  const handleApplyOptions = () => {
    onCustomizationApply({
      options: {
        plugins: {
          legend: {
            display: showLegend,
            position: legendPosition,
            align: legendAlign,
          },
        },
        scales: {
          x: {
            grid: {
              display: showGridLines,
              color: gridLineColor,
              lineWidth: gridLineWidth,
            },
            ticks: {
              color: xAxisLabelColor,
              rotation: xAxisTickRotation,
            },
          },
          y: {
            grid: {
              display: showGridLines,
              color: gridLineColor,
              lineWidth: gridLineWidth,
            },
            ticks: {
              color: yAxisLabelColor,
            },
            min: yAxisMin ? Number.parseFloat(yAxisMin) : undefined,
            max: yAxisMax ? Number.parseFloat(yAxisMax) : undefined,
          },
        },
        animation: {
          duration: enableAnimations ? animationDuration : 0,
          easing: animationType,
        },
        elements: {
          point: {
            radius: pointSize,
          },
          line: {
            borderWidth: lineThickness,
          },
          bar: {
            borderWidth: 1,
            barPercentage: barThickness,
          },
        },
        layout: {
          padding: 10,
        },
        backgroundColor: backgroundColor,
      },
    })
  }

  // Apply advanced settings
  const handleApplyAdvanced = () => {
    onCustomizationApply({
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            enabled: true,
            mode: "index",
            intersect: false,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            borderColor: "rgba(255, 255, 255, 0.2)",
            borderWidth: 1,
            padding: 10,
            cornerRadius: 4,
          },
          datalabels: {
            display: false,
          },
        },
        interaction: {
          mode: "nearest",
          axis: "xy",
          intersect: false,
        },
      },
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

  // Font options
  const fontOptions = [
    { value: "Inter", label: "Inter" },
    { value: "Arial", label: "Arial" },
    { value: "Helvetica", label: "Helvetica" },
    { value: "Times New Roman", label: "Times New Roman" },
    { value: "Courier New", label: "Courier New" },
    { value: "Georgia", label: "Georgia" },
    { value: "Verdana", label: "Verdana" },
    { value: "system-ui", label: "System UI" },
  ]

  // Animation options
  const animationOptions = [
    { value: "linear", label: "Linear" },
    { value: "easeInQuad", label: "Ease In" },
    { value: "easeOutQuad", label: "Ease Out" },
    { value: "easeInOutQuad", label: "Ease In Out" },
    { value: "easeInCubic", label: "Ease In Cubic" },
    { value: "easeOutCubic", label: "Ease Out Cubic" },
    { value: "easeInOutCubic", label: "Ease In Out Cubic" },
    { value: "easeInQuart", label: "Ease In Quart" },
    { value: "easeOutQuart", label: "Ease Out Quart" },
    { value: "easeInOutQuart", label: "Ease In Out Quart" },
  ]

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-md">Advanced Chart Customization</CardTitle>
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
            <TabsTrigger value="axes" className="flex items-center gap-1">
              <Sliders className="h-4 w-4" />
              <span>Axes</span>
            </TabsTrigger>
            <TabsTrigger value="style" className="flex items-center gap-1">
              <Paintbrush className="h-4 w-4" />
              <span>Style</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-1">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </TabsTrigger>
          </TabsList>

          {/* TEXT TAB */}
          <TabsContent value="labels" className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            <Accordion type="single" collapsible defaultValue="title">
              <AccordionItem value="title">
                <AccordionTrigger className="text-sm font-medium">
                  <TextCursorInput className="h-4 w-4 mr-2" />
                  Title & Subtitle
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
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
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title-font">Font Family</Label>
                      <Select value={titleFont} onValueChange={setTitleFont}>
                        <SelectTrigger id="title-font">
                          <SelectValue placeholder="Select font" />
                        </SelectTrigger>
                        <SelectContent>
                          {fontOptions.map(font => (
                            <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="title-size">Font Size</Label>
                      <div className="flex items-center gap-2">
                        <Slider 
                          id="title-size"
                          min={12} 
                          max={36} 
                          step={1} 
                          value={[titleSize]} 
                          onValueChange={(value) => setTitleSize(value[0])} 
                          className="flex-1"
                        />
                        <span className="text-sm w-8 text-center">{titleSize}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title-color">Title Color</Label>
                      <div className="flex gap-2">
                        <ColorPicker
                          color={titleColor}
                          onChange={setTitleColor}
                        />
                        <Input
                          id="title-color"
                          value={titleColor}
                          onChange={(e) => setTitleColor(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="title-align">Alignment</Label>
                      <Select value={titleAlign} onValueChange={setTitleAlign}>
                        <SelectTrigger id="title-align">
                          <SelectValue placeholder="Select alignment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="start">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="end">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="axes-labels">
                <AccordionTrigger className="text-sm font-medium">
                  <Sliders className="h-4 w-4 mr-2" />
                  Axis Labels
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
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
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="x-label-color">X-Axis Color</Label>
                          <div className="flex gap-2">
                            <ColorPicker
                              color={xAxisLabelColor}
                              onChange={setXAxisLabelColor}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="y-label-color">Y-Axis Color</Label>
                          <div className="flex gap-2">
                            <ColorPicker
                              color={yAxisLabelColor}
                              onChange={setYAxisLabelColor}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <Button 
              onClick={handleApplyLabels} 
              className="w-full transition-all duration-300 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Check className="h-4 w-4 mr-2" />
              Apply Text Changes
            </Button>
          </TabsContent>

          {/* COLORS TAB */}
          <TabsContent value="colors" className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
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
                    <SelectItem value="monochrome">Monochrome</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="cool">Cool</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />
              
              <div className="space-y-2">
                <Label className="mb-2 block">Background Color</Label>
                <div className="flex gap-2 items-center">
                  <ColorPicker
                    color={backgroundColor}
                    onChange={setBackgroundColor}
                  />
                  <Input
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    placeholder="#ffffff or transparent"
                    className="flex-1"
                  />
                </div>
              </div>

              <Separator />
              
              <div className="space-y-4">
                <Label className="mb-2 block">Custom Dataset Colors</Label>
                {getDatasetNames().map((dataset) => (
                  <div key={dataset.index} className="flex items-center justify-between mb-2">
                    <span className="text-sm">{dataset.name}</span>
                    <div className="flex gap-2">
                      <ColorPicker
                        color={
                          customColors[dataset.index] ||
                          chart?.data?.datasets?.[dataset.index]?.backgroundColor ||
                          "#4f46e5"
                        }
                        onChange={(color) => handleColorChange(dataset.index, color)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label className="mb-2 block">Quick Color Presets</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleColorSchemeChange("blue")}>
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                    Blue Theme
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleColorSchemeChange("green")}>
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    Green Theme
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleColorSchemeChange("purple")}>
                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                    Purple Theme
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleColorSchemeChange("rainbow")}>
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500 mr-2"></div>
                    Rainbow
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleColorSchemeChange("pastel")}>
                    <div className="w-3 h-3 rounded-full bg-pink-200 mr-2"></div>
                    Pastel
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleColorSchemeChange("monochrome")}>
                    <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                    Monochrome
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* AXES TAB */}
          <TabsContent value="axes" className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            {chart?.type !== "pie" ? (
              <Accordion type="single" collapsible defaultValue="grid">
                <AccordionItem value="grid">
                  <AccordionTrigger className="text-sm font-medium">
                    <Grid className="h-4 w-4 mr-2" />
                    Grid Lines
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="show-gridlines">Show Grid Lines</Label>
                      <Switch id="show-gridlines" checked={showGridLines} onCheckedChange={setShowGridLines} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="grid-color">Grid Line Color</Label>
                      <div className="flex gap-2">
                        <ColorPicker
                          color={gridLineColor}
                          onChange={setGridLineColor}
                        />
                        <Input
                          id="grid-color"
                          value={gridLineColor}
                          onChange={(e) => setGridLineColor(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="grid-width">Grid Line Width</Label>
                      <div className="flex items-center gap-2">
                        <Slider 
                          id="grid-width"
                          min={0.5} 
                          max={3} 
                          step={0.5} 
                          value={[gridLineWidth]} 
                          onValueChange={(value) => setGridLineWidth(value[0])} 
                          className="flex-1"
                        />
                        <span className="text-sm w-8 text-center">{gridLineWidth}</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="axis-range">
                  <AccordionTrigger className="text-sm font-medium">
                    <Sliders className="h-4 w-4 mr-2" />
                    Axis Range
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="y-axis-min">Y-Axis Minimum</Label>
                      <Input
                        id="y-axis-min"
                        type="number"
                        value={yAxisMin}
                        onChange={(e) => setYAxisMin(e.target.value)}
                        placeholder="Auto (leave empty)"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="y-axis-max">Y-Axis Maximum</Label>
                      <Input
                        id="y-axis-max"
                        type="number"
                        value={yAxisMax}
                        onChange={(e) => setYAxisMax(e.target.value)}
                        placeholder="Auto (leave empty)"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="x-axis-rotation">X-Axis Label Rotation</Label>
                      <div className="flex items-center gap-2">
                        <Slider 
                          id="x-axis-rotation"
                          min={0} 
                          max={90} 
                          step={5} 
                          value={[xAxisTickRotation]} 
                          onValueChange={(value) => setXAxisTickRotation(value[0])} 
                          className="flex-1"
                        />
                        <span className="text-sm w-8 text-center">{xAxisTickRotation}°</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="legend">
                  <AccordionTrigger className="text-sm font-medium">
                    <Layers className="h-4 w-4 mr-2" />
                    Legend
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2">
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="legend-align">Legend Alignment</Label>
                      <Select value={legendAlign} onValueChange={setLegendAlign}>
                        <SelectTrigger id="legend-align">
                          <SelectValue placeholder="Select legend alignment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="start">Start</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="end">End</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              <Button\
                onClick={handleApplyOptions}
                className="w-full transition-all duration-300 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Check className="h-4 w-4 mr-2" />
                Apply Axes Changes
              </Button>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <PieChartIcon className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">Axes settings are not applicable to pie charts.</p>
              </div>
            )}
          </TabsContent>

          {/* STYLE TAB */}
          <TabsContent value="style" className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            <Accordion type="single" collapsible defaultValue="animation">
              <AccordionItem value="animation">
                <AccordionTrigger className="text-sm font-medium">
                  <LineChart className="h-4 w-4 mr-2" />
                  Animation
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enable-animations">Enable Animations</Label>
                    <Switch id="enable-animations" checked={enableAnimations} onCheckedChange={setEnableAnimations} />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="animation-duration">Animation Duration (ms)</Label>
                    <div className="flex items-center gap-2">
                      <Slider 
                        id="animation-duration"
                        min={200} 
                        max={2000} 
                        step={100} 
                        value={[animationDuration]} 
                        onValueChange={(value) => setAnimationDuration(value[0])} 
                        className="flex-1"
                        disabled={!enableAnimations}
                      />
                      <span className="text-sm w-12 text-center">{animationDuration}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="animation-type">Animation Type</Label>
                    <Select 
                      value={animationType} 
                      onValueChange={setAnimationType}
                      disabled={!enableAnimations}
                    >
                      <SelectTrigger id="animation-type">
                        <SelectValue placeholder="Select animation type" />
                      </SelectTrigger>
                      <SelectContent>
                        {animationOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="data-points">
                <AccordionTrigger className="text-sm font-medium">
                  {chart?.type === "bar" ? (
                    <BarChartIcon className="h-4 w-4 mr-2" />
                  ) : (
                    <LineChart className="h-4 w-4 mr-2" />
                  )}
                  Data Points
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  {chart?.type === "line" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="point-size">Point Size</Label>
                        <div className="flex items-center gap-2">
                          <Slider 
                            id="point-size"
                            min={0} 
                            max={10} 
                            step={1} 
                            value={[pointSize]} 
                            onValueChange={(value) => setPointSize(value[0])} 
                            className="flex-1"
                          />
                          <span className="text-sm w-8 text-center">{pointSize}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="line-thickness">Line Thickness</Label>
                        <div className="flex items-center gap-2">
                          <Slider 
                            id="line-thickness"
                            min={1} 
                            max={8} 
                            step={1} 
                            value={[lineThickness]} 
                            onValueChange={(value) => setLineThickness(value[0])} 
                            className="flex-1"
                          />
                          <span className="text-sm w-8 text-center">{lineThickness}</span>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {chart?.type === "bar" && (
                    <div className="space-y-2">
                      <Label htmlFor="bar-thickness">Bar Thickness</Label>
                      <div className="flex items-center gap-2">
                        <Slider 
                          id="bar-thickness"
                          min={0.1} 
                          max={1} 
                          step={0.1} 
                          value={[barThickness]} 
                          onValueChange={(value) => setBarThickness(value[0])} 
                          className="flex-1"
                        />
                        <span className="text-sm w-8 text-center">{barThickness}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Controls the width of bars as a percentage of available space (0.1 = thin, 1 = full width)
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <Button 
              onClick={handleApplyAdvanced} 
              className="w-full transition-all duration-300 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Check className="h-4 w-4 mr-2" />
              Apply Style Changes
            </Button>
          </TabsContent>

          {/* EXPORT TAB */}
          <TabsContent value="export" className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="export-format">Export Format</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger id="export-format">
                  <SelectValue placeholder="Select export format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="png">PNG Image</SelectItem>
                  <SelectItem value="jpg">JPEG Image</SelectItem>
                  <SelectItem value="svg">SVG Vector</SelectItem>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="export-quality">Image Quality</Label>
              <Select value={exportQuality} onValueChange={setExportQuality}>
                <SelectTrigger id="export-quality">
                  <SelectValue placeholder="Select image quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="export-width">Width (px)</Label>
                <Input
                  id="export-width"
                  type="number"
                  value={exportWidth}
                  onChange={(e) => setExportWidth(Number.parseInt(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="export-height">Height (px)</Label>
                <Input
                  id="export-height"
                  type="number"
                  value={exportHeight}
                  onChange={(e) => setExportHeight(Number.parseInt(e.target.value))}
                />
              </div>
            </div>
            
            <div className="space-y-2 pt-4">
              <Label>Export Options</Label>
              <RadioGroup defaultValue="transparent">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="transparent" id="bg-transparent" />
                  <Label htmlFor="bg-transparent">Transparent background</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="white" id="bg-white" />
                  <Label htmlFor="bg-white">White background</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="bg-custom" />
                  <Label htmlFor="bg-custom">Use chart background color</Label>
                </div>
              </RadioGroup>
            </div>

            <Button 
              className="w-full mt-4 flex items-center justify-center gap-2 transition-all duration-300 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]" 
              onClick={onExport} 
              data-export-chart
            >
              <Download className="h-4 w-4" />
              <span>Download Chart</span>
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
  </Card>
  )
}

