"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Paintbrush, Check, Pipette, Palette } from "lucide-react"

interface EnhancedColorPickerProps {
  color: string
  onChange: (color: string) => void
  showAlpha?: boolean
  showGradient?: boolean
}

// Color palettes
const colorPalettes = {
  basic: ["#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#00ffff", "#ff00ff"],
  material: [
    "#f44336",
    "#e91e63",
    "#9c27b0",
    "#673ab7",
    "#3f51b5",
    "#2196f3",
    "#03a9f4",
    "#00bcd4",
    "#009688",
    "#4caf50",
    "#8bc34a",
    "#cddc39",
    "#ffeb3b",
    "#ffc107",
    "#ff9800",
    "#ff5722",
  ],
  pastel: ["#ffb3ba", "#ffdfba", "#ffffba", "#baffc9", "#bae1ff", "#e2baff", "#f8baff", "#baffe8"],
  gradient: [
    "linear-gradient(to right, #ff0000, #ffff00)",
    "linear-gradient(to right, #00ff00, #00ffff)",
    "linear-gradient(to right, #0000ff, #ff00ff)",
    "linear-gradient(to right, #ff0000, #0000ff)",
    "linear-gradient(to right, #ffff00, #00ffff)",
    "linear-gradient(to right, #ff00ff, #00ff00)",
    "linear-gradient(to right, #000000, #ffffff)",
    "linear-gradient(to right, #ff0000, #00ff00, #0000ff)",
  ],
}

// Convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1], 16),
        g: Number.parseInt(result[2], 16),
        b: Number.parseInt(result[3], 16),
      }
    : null
}

// Convert RGB to hex
const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)
}

// Convert RGB to HSL
const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }

    h /= 6
  }

  return { h, s, l }
}

// Convert HSL to RGB
const hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  }
}

export function EnhancedColorPicker({
  color,
  onChange,
  showAlpha = true,
  showGradient = false,
}: EnhancedColorPickerProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("palette")
  const [hexValue, setHexValue] = useState(color.startsWith("#") ? color : "#000000")
  const [rgbValues, setRgbValues] = useState({ r: 0, g: 0, b: 0 })
  const [hslValues, setHslValues] = useState({ h: 0, s: 0, l: 0 })
  const [alpha, setAlpha] = useState(100)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const hueRef = useRef<HTMLCanvasElement>(null)

  // Initialize color values
  useEffect(() => {
    // Ensure color is a string and has a valid format
    const colorStr = typeof color === "string" ? color : "#000000"

    if (colorStr.startsWith("#")) {
      setHexValue(colorStr)
      const rgb = hexToRgb(colorStr)
      if (rgb) {
        setRgbValues(rgb)
        setHslValues(rgbToHsl(rgb.r, rgb.g, rgb.b))
      }
    } else if (colorStr.startsWith("rgba")) {
      const match = colorStr.match(/rgba$$(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)$$/)
      if (match) {
        const r = Number.parseInt(match[1])
        const g = Number.parseInt(match[2])
        const b = Number.parseInt(match[3])
        const a = Number.parseFloat(match[4]) * 100
        setRgbValues({ r, g, b })
        setHexValue(rgbToHex(r, g, b))
        setHslValues(rgbToHsl(r, g, b))
        setAlpha(a)
      } else {
        // Invalid rgba format, use default
        setHexValue("#000000")
        setRgbValues({ r: 0, g: 0, b: 0 })
        setHslValues({ h: 0, s: 0, l: 0 })
      }
    } else if (colorStr.startsWith("rgb")) {
      const match = colorStr.match(/rgb$$(\d+),\s*(\d+),\s*(\d+)$$/)
      if (match) {
        const r = Number.parseInt(match[1])
        const g = Number.parseInt(match[2])
        const b = Number.parseInt(match[3])
        setRgbValues({ r, g, b })
        setHexValue(rgbToHex(r, g, b))
        setHslValues(rgbToHsl(r, g, b))
      } else {
        // Invalid rgb format, use default
        setHexValue("#000000")
        setRgbValues({ r: 0, g: 0, b: 0 })
        setHslValues({ h: 0, s: 0, l: 0 })
      }
    } else {
      // Not a recognized color format, use default
      setHexValue("#000000")
      setRgbValues({ r: 0, g: 0, b: 0 })
      setHslValues({ h: 0, s: 0, l: 0 })
    }
  }, [color])

  // Draw color picker canvas
  useEffect(() => {
    if (canvasRef.current && pickerRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (ctx) {
        // Draw saturation-lightness gradient
        const width = canvas.width
        const height = canvas.height
        ctx.clearRect(0, 0, width, height)

        // Draw saturation gradient (x-axis)
        const satGradient = ctx.createLinearGradient(0, 0, width, 0)
        satGradient.addColorStop(0, `hsl(${hslValues.h * 360}, 0%, 50%)`)
        satGradient.addColorStop(1, `hsl(${hslValues.h * 360}, 100%, 50%)`)
        ctx.fillStyle = satGradient
        ctx.fillRect(0, 0, width, height)

        // Draw lightness gradient (y-axis)
        const lightGradient = ctx.createLinearGradient(0, 0, 0, height)
        lightGradient.addColorStop(0, "rgba(255, 255, 255, 1)")
        lightGradient.addColorStop(0.5, "rgba(255, 255, 255, 0)")
        lightGradient.addColorStop(0.5, "rgba(0, 0, 0, 0)")
        lightGradient.addColorStop(1, "rgba(0, 0, 0, 1)")
        ctx.fillStyle = lightGradient
        ctx.fillRect(0, 0, width, height)

        // Position the picker
        const pickerX = hslValues.s * width
        const pickerY = (1 - hslValues.l) * height
        pickerRef.current.style.left = `${pickerX}px`
        pickerRef.current.style.top = `${pickerY}px`
      }
    }
  }, [hslValues.h, hslValues.s, hslValues.l, open])

  // Draw hue slider canvas
  useEffect(() => {
    if (hueRef.current) {
      const canvas = hueRef.current
      const ctx = canvas.getContext("2d")
      if (ctx) {
        const width = canvas.width
        const height = canvas.height
        ctx.clearRect(0, 0, width, height)

        // Draw hue gradient
        const gradient = ctx.createLinearGradient(0, 0, width, 0)
        for (let i = 0; i <= 1; i += 1 / 6) {
          gradient.addColorStop(i, `hsl(${i * 360}, 100%, 50%)`)
        }
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)
      }
    }
  }, [open])

  // Handle color picker canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const s = x / canvas.width
      const l = 1 - y / canvas.height

      // Update HSL values
      setHslValues({ ...hslValues, s, l })

      // Convert to RGB and hex
      const rgb = hslToRgb(hslValues.h, s, l)
      setRgbValues(rgb)
      setHexValue(rgbToHex(rgb.r, rgb.g, rgb.b))

      // Update color
      updateColor(rgb.r, rgb.g, rgb.b, alpha)
    }
  }

  // Handle hue slider click
  const handleHueClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hueRef.current) {
      const canvas = hueRef.current
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const h = x / canvas.width

      // Update HSL values
      setHslValues({ ...hslValues, h })

      // Convert to RGB and hex
      const rgb = hslToRgb(h, hslValues.s, hslValues.l)
      setRgbValues(rgb)
      setHexValue(rgbToHex(rgb.r, rgb.g, rgb.b))

      // Update color
      updateColor(rgb.r, rgb.g, rgb.b, alpha)
    }
  }

  // Handle hex input change
  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setHexValue(value)

    // Only update if it's a valid hex color
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      const rgb = hexToRgb(value)
      if (rgb) {
        setRgbValues(rgb)
        setHslValues(rgbToHsl(rgb.r, rgb.g, rgb.b))
        updateColor(rgb.r, rgb.g, rgb.b, alpha)
      }
    }
  }

  // Handle RGB input changes
  const handleRgbChange = (channel: "r" | "g" | "b", value: number) => {
    const newRgb = { ...rgbValues, [channel]: value }
    setRgbValues(newRgb)

    // Update hex
    setHexValue(rgbToHex(newRgb.r, newRgb.g, newRgb.b))

    // Update HSL
    setHslValues(rgbToHsl(newRgb.r, newRgb.g, newRgb.b))

    // Update color
    updateColor(newRgb.r, newRgb.g, newRgb.b, alpha)
  }

  // Handle alpha change
  const handleAlphaChange = (value: number[]) => {
    const newAlpha = value[0]
    setAlpha(newAlpha)
    updateColor(rgbValues.r, rgbValues.g, rgbValues.b, newAlpha)
  }

  // Update the final color value
  const updateColor = (r: number, g: number, b: number, a: number) => {
    if (a < 100 && showAlpha) {
      onChange(`rgba(${r}, ${g}, ${b}, ${a / 100})`)
    } else {
      onChange(rgbToHex(r, g, b))
    }
  }

  // Handle palette color selection
  const handlePaletteSelect = (paletteColor: string) => {
    if (paletteColor.startsWith("linear-gradient")) {
      // Handle gradient selection if supported
      if (showGradient) {
        onChange(paletteColor)
        setOpen(false)
      }
    } else {
      // Handle solid color selection
      setHexValue(paletteColor)
      const rgb = hexToRgb(paletteColor)
      if (rgb) {
        setRgbValues(rgb)
        setHslValues(rgbToHsl(rgb.r, rgb.g, rgb.b))
        updateColor(rgb.r, rgb.g, rgb.b, alpha)
      }
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-10 h-10 p-0 border-2"
          style={{
            background:
              typeof color === "string" && color.startsWith("linear-gradient")
                ? color
                : typeof color === "string"
                  ? color
                  : "#000000",
            borderColor: "hsl(var(--border))",
          }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3">
        <Tabs defaultValue="palette" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-2">
            <TabsTrigger value="palette" className="flex items-center gap-1">
              <Palette className="h-4 w-4" />
              <span>Palette</span>
            </TabsTrigger>
            <TabsTrigger value="picker" className="flex items-center gap-1">
              <Pipette className="h-4 w-4" />
              <span>Picker</span>
            </TabsTrigger>
            <TabsTrigger value="sliders" className="flex items-center gap-1">
              <Paintbrush className="h-4 w-4" />
              <span>Sliders</span>
            </TabsTrigger>
          </TabsList>

          {/* Palette Tab */}
          <TabsContent value="palette" className="space-y-4">
            <div className="space-y-2">
              <Label>Basic Colors</Label>
              <div className="grid grid-cols-8 gap-1">
                {colorPalettes.basic.map((paletteColor) => (
                  <Button
                    key={paletteColor}
                    variant="outline"
                    className="w-7 h-7 p-0 rounded-md"
                    style={{ backgroundColor: paletteColor }}
                    onClick={() => handlePaletteSelect(paletteColor)}
                  >
                    {paletteColor === hexValue && (
                      <Check className="h-3 w-3 text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Material Colors</Label>
              <div className="grid grid-cols-8 gap-1">
                {colorPalettes.material.map((paletteColor) => (
                  <Button
                    key={paletteColor}
                    variant="outline"
                    className="w-7 h-7 p-0 rounded-md"
                    style={{ backgroundColor: paletteColor }}
                    onClick={() => handlePaletteSelect(paletteColor)}
                  >
                    {paletteColor === hexValue && (
                      <Check className="h-3 w-3 text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
                    )}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Pastel Colors</Label>
              <div className="grid grid-cols-8 gap-1">
                {colorPalettes.pastel.map((paletteColor) => (
                  <Button
                    key={paletteColor}
                    variant="outline"
                    className="w-7 h-7 p-0 rounded-md"
                    style={{ backgroundColor: paletteColor }}
                    onClick={() => handlePaletteSelect(paletteColor)}
                  >
                    {paletteColor === hexValue && (
                      <Check className="h-3 w-3 text-white drop-shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {showGradient && (
              <div className="space-y-2">
                <Label>Gradients</Label>
                <div className="grid grid-cols-2 gap-1">
                  {colorPalettes.gradient.map((gradient) => (
                    <Button
                      key={gradient}
                      variant="outline"
                      className="h-8 p-0 rounded-md"
                      style={{ background: gradient }}
                      onClick={() => handlePaletteSelect(gradient)}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Color Picker Tab */}
          <TabsContent value="picker" className="space-y-4">
            <div className="relative w-full h-40 mb-4">
              <canvas
                ref={canvasRef}
                width={240}
                height={160}
                className="w-full h-full cursor-crosshair rounded-md"
                onClick={handleCanvasClick}
              />
              <div
                ref={pickerRef}
                className="absolute w-4 h-4 border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.3)",
                  backgroundColor: `hsl(${hslValues.h * 360}, ${hslValues.s * 100}%, ${hslValues.l * 100}%)`,
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Hue</Label>
              <div className="relative h-8 rounded-md overflow-hidden">
                <canvas
                  ref={hueRef}
                  width={240}
                  height={20}
                  className="w-full h-full cursor-pointer"
                  onClick={handleHueClick}
                />
                <div
                  className="absolute top-0 w-1 h-full bg-white border-x border-gray-400 pointer-events-none"
                  style={{ left: `${hslValues.h * 100}%` }}
                />
              </div>
            </div>

            {showAlpha && (
              <div className="space-y-2">
                <Label>Opacity: {alpha}%</Label>
                <Slider value={[alpha]} min={0} max={100} step={1} onValueChange={handleAlphaChange} />
              </div>
            )}

            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-md border"
                style={{
                  backgroundColor:
                    alpha < 100 && showAlpha
                      ? `rgba(${rgbValues.r}, ${rgbValues.g}, ${rgbValues.b}, ${alpha / 100})`
                      : hexValue,
                  backgroundImage:
                    "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                  backgroundSize: "10px 10px",
                  backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
                }}
              />
              <Input value={hexValue} onChange={handleHexChange} className="font-mono" maxLength={7} />
            </div>
          </TabsContent>

          {/* RGB Sliders Tab */}
          <TabsContent value="sliders" className="space-y-4">
            <div className="space-y-2">
              <Label>Red: {rgbValues.r}</Label>
              <Slider
                value={[rgbValues.r]}
                min={0}
                max={255}
                step={1}
                onValueChange={(value) => handleRgbChange("r", value[0])}
                className="bg-gradient-to-r from-black to-red-600"
              />
            </div>

            <div className="space-y-2">
              <Label>Green: {rgbValues.g}</Label>
              <Slider
                value={[rgbValues.g]}
                min={0}
                max={255}
                step={1}
                onValueChange={(value) => handleRgbChange("g", value[0])}
                className="bg-gradient-to-r from-black to-green-600"
              />
            </div>

            <div className="space-y-2">
              <Label>Blue: {rgbValues.b}</Label>
              <Slider
                value={[rgbValues.b]}
                min={0}
                max={255}
                step={1}
                onValueChange={(value) => handleRgbChange("b", value[0])}
                className="bg-gradient-to-r from-black to-blue-600"
              />
            </div>

            {showAlpha && (
              <div className="space-y-2">
                <Label>Alpha: {alpha}%</Label>
                <Slider value={[alpha]} min={0} max={100} step={1} onValueChange={handleAlphaChange} />
              </div>
            )}

            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-md border"
                style={{
                  backgroundColor:
                    alpha < 100 && showAlpha
                      ? `rgba(${rgbValues.r}, ${rgbValues.g}, ${rgbValues.b}, ${alpha / 100})`
                      : hexValue,
                  backgroundImage:
                    "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)",
                  backgroundSize: "10px 10px",
                  backgroundPosition: "0 0, 0 5px, 5px -5px, -5px 0px",
                }}
              />
              <div className="grid grid-cols-3 gap-1 flex-1">
                <Input
                  value={rgbValues.r}
                  onChange={(e) => handleRgbChange("r", Number.parseInt(e.target.value) || 0)}
                  className="font-mono"
                  type="number"
                  min={0}
                  max={255}
                />
                <Input
                  value={rgbValues.g}
                  onChange={(e) => handleRgbChange("g", Number.parseInt(e.target.value) || 0)}
                  className="font-mono"
                  type="number"
                  min={0}
                  max={255}
                />
                <Input
                  value={rgbValues.b}
                  onChange={(e) => handleRgbChange("b", Number.parseInt(e.target.value) || 0)}
                  className="font-mono"
                  type="number"
                  min={0}
                  max={255}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}

