"use client"

import { useEffect, useRef } from "react"

interface BoxPlotProps {
  data: any
}

export function BoxPlot({ data }: BoxPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !data.data.boxplotData) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set dimensions with better padding
    const padding = 60
    const width = canvas.width - padding * 2
    const height = canvas.height - padding * 2
    const boxWidth = width / data.data.boxplotData.length / 2

    // Find min and max values
    let min = Number.POSITIVE_INFINITY
    let max = Number.NEGATIVE_INFINITY
    data.data.boxplotData.forEach((box: any) => {
      min = Math.min(min, box.min)
      max = Math.max(max, box.max)
    })

    // Add some padding to min and max
    const range = max - min
    min = min - range * 0.1
    max = max + range * 0.1

    // Function to convert value to y position
    const valueToY = (value: number) => {
      return padding + height - ((value - min) / (max - min)) * height
    }

    // Draw axes
    ctx.strokeStyle = "#ccc"
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, padding + height)
    ctx.lineTo(padding + width, padding + height)
    ctx.stroke()

    // Draw y-axis labels with better font
    ctx.fillStyle = "#666"
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"
    ctx.font = "11px Arial"
    const steps = 5
    for (let i = 0; i <= steps; i++) {
      const value = min + (max - min) * (i / steps)
      const y = valueToY(value)
      ctx.fillText(value.toFixed(1), padding - 5, y)
    }

    // Add y-axis title if available
    if (data.yLabel) {
      ctx.save()
      ctx.translate(15, padding + height / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = "center"
      ctx.font = "12px Arial"
      ctx.fillText(data.yLabel, 0, 0)
      ctx.restore()
    }

    // Draw each box plot
    data.data.boxplotData.forEach((box: any, index: number) => {
      const x = padding + (index + 0.5) * (width / data.data.boxplotData.length)

      // Draw vertical line from min to max
      ctx.strokeStyle = "#666"
      ctx.beginPath()
      ctx.moveTo(x, valueToY(box.min))
      ctx.lineTo(x, valueToY(box.max))
      ctx.stroke()

      // Draw box from q1 to q3
      ctx.fillStyle = "rgba(75, 192, 192, 0.2)"
      ctx.strokeStyle = "rgba(75, 192, 192, 1)"
      ctx.beginPath()
      ctx.rect(x - boxWidth / 2, valueToY(box.q3), boxWidth, valueToY(box.q1) - valueToY(box.q3))
      ctx.fill()
      ctx.stroke()

      // Draw median line
      ctx.strokeStyle = "rgba(75, 192, 192, 1)"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x - boxWidth / 2, valueToY(box.median))
      ctx.lineTo(x + boxWidth / 2, valueToY(box.median))
      ctx.stroke()
      ctx.lineWidth = 1

      // Draw whiskers
      ctx.strokeStyle = "#666"
      ctx.beginPath()
      // Min whisker
      ctx.moveTo(x - boxWidth / 4, valueToY(box.min))
      ctx.lineTo(x + boxWidth / 4, valueToY(box.min))
      // Max whisker
      ctx.moveTo(x - boxWidth / 4, valueToY(box.max))
      ctx.lineTo(x + boxWidth / 4, valueToY(box.max))
      ctx.stroke()

      // Draw label with better font
      ctx.fillStyle = "#666"
      ctx.textAlign = "center"
      ctx.textBaseline = "top"
      ctx.font = "11px Arial"
      ctx.fillText(box.label || `Group ${index + 1}`, x, padding + height + 5)
    })

    // Add x-axis title if available
    if (data.xLabel) {
      ctx.textAlign = "center"
      ctx.font = "12px Arial"
      ctx.fillText(data.xLabel, padding + width / 2, padding + height + 30)
    }
  }, [data])

  return (
    <div className="h-full w-full flex items-center justify-center min-h-[450px]">
      <canvas ref={canvasRef} width={800} height={500} className="w-full h-full" />
    </div>
  )
}

