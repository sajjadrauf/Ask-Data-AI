"use client"

import { EnhancedColorPicker } from "./enhanced-color-picker"

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  // Ensure color is a string
  const safeColor = typeof color === "string" ? color : "#000000"
  return <EnhancedColorPicker color={safeColor} onChange={onChange} showAlpha={true} />
}

