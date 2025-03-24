"use client"

import { useEffect, useRef } from "react"

interface HeatMapProps {
  data: any
}

export function HeatMap({ data }: HeatMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !data.data.matrix) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Get data
    const matrix = data.data.matrix
    const rowLabels = data.data.rowLabels || []
    const colLabels = data.data.colLabels || []

    // Set dimensions with better padding
    const padding = 70
    const width = canvas.width - padding * 2
    const height = canvas.height - padding * 2
    const cellWidth = width / matrix[0].length
    const cellHeight = height / matrix.length

    // Find min and max values
    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY
    matrix.forEach((row: number[]) => {
      row.forEach((value) => {
        min = Math.min(min, value)
        max = Math.max(max, value)
      })
    })

    // Function to get color based on value
    const getColor = (value: number) => {
      const normalizedValue = (value - min) / (max - min)
      // Blue to red color scale
      const r = Math.floor(normalizedValue * 255)
      const b = Math.floor((1 - normalizedValue) * 255)
      return `rgb(${r}, 0, ${b})`
    }

    // Draw heatmap cells
    matrix.forEach((row: number[], rowIndex: number) => {
      row.forEach((value: number, colIndex: number) => {
        const x = padding + colIndex * cellWidth
        const y = padding + rowIndex * cellHeight

        ctx.fillStyle = getColor(value)
        ctx.fillRect(x, y, cellWidth, cellHeight)

        // Add cell border
        ctx.strokeStyle = "#fff"
        ctx.strokeRect(x, y, cellWidth, cellHeight)

        // Add value text with better font
        ctx.fillStyle = "#fff"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.font = "10px Arial"
        ctx.fillText(value.toFixed(1), x + cellWidth / 2, y + cellHeight / 2)
      })
    })

    // Draw row labels with better font
    ctx.fillStyle = "#666"
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    ctx.font = "11px Arial"
    rowLabels.forEach((label: string, index: number) => {
      const y = padding + (index + 0.5) * cellHeight
      ctx.fillText(label, padding - 5, y)
    })

    // Draw column labels with better font and rotation for readability
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.font = "11px Arial"
    colLabels.forEach((label: string, index: number) => {
      const x = padding + (index + 0.5) * cellWidth
      ctx.save()
      ctx.translate(x, padding - 10)
      ctx.rotate(-Math.PI / 4)
      ctx.fillText(label, 0, 0)
      ctx.restore()
    })

    // Add title if available
    if (data.title) {
      ctx.textAlign = "center"
      ctx.textBaseline = "top"
      ctx.font = "14px Arial"
      ctx.fillText(data.title, canvas.width / 2, 10)
    }

    // Draw color scale
    const scaleWidth = 20
    const scaleHeight = height
    const scaleX = canvas.width - padding / 2
    const scaleY = padding

    // Draw gradient
    const gradient = ctx.createLinearGradient(0, scaleY, 0, scaleY + scaleHeight)
    gradient.addColorStop(0, "rgb(255, 0, 0)") // Red at top (max)
    gradient.addColorStop(1, "rgb(0, 0, 255)") // Blue at bottom (min)

    ctx.fillStyle = gradient
    ctx.fillRect(scaleX - scaleWidth / 2, scaleY, scaleWidth, scaleHeight)

    // Draw scale labels with better font
    ctx.fillStyle = "#666"
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.font = "11px Arial"
    ctx.fillText(max.toFixed(1), scaleX + scaleWidth / 2 + 5, scaleY)
    ctx.fillText(min.toFixed(1), scaleX + scaleWidth / 2 + 5, scaleY + scaleHeight)
  }, [data])

  return (
    <div className="h-full w-full flex items-center justify-center min-h-[450px]">
      <canvas ref={canvasRef} width={800} height={500} className="w-full h-full" />
    </div>
  )
}

