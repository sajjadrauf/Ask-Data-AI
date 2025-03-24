"use client"

import { Bar, Line, Pie, Scatter } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js"
import { useEffect, useRef } from "react"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

interface ChartProps {
  data: any
  xLabel?: string
  yLabel?: string
  options?: any
}

export function BarChartComponent({ data, xLabel, yLabel, options = {} }: ChartProps) {
  // Safety check for data
  if (!data || !data.labels || !data.datasets || data.datasets.length === 0) {
    console.warn("BarChartComponent received invalid data:", data)
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-muted-foreground">No valid data for bar chart</div>
      </div>
    )
  }

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        title: {
          display: !!xLabel,
          text: xLabel,
        },
      },
      y: {
        title: {
          display: !!yLabel,
          text: yLabel,
        },
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="h-full w-full">
      <Bar data={data} options={{ ...defaultOptions, ...options }} />
    </div>
  )
}

export function LineChartComponent({ data, xLabel, yLabel, options = {} }: ChartProps) {
  // Safety check for data
  if (!data || !data.labels || !data.datasets || data.datasets.length === 0) {
    console.warn("LineChartComponent received invalid data:", data)
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-muted-foreground">No valid data for line chart</div>
      </div>
    )
  }

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        title: {
          display: !!xLabel,
          text: xLabel,
        },
      },
      y: {
        title: {
          display: !!yLabel,
          text: yLabel,
        },
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="h-full w-full">
      <Line data={data} options={{ ...defaultOptions, ...options }} />
    </div>
  )
}

export function PieChartComponent({ data, options = {} }: ChartProps) {
  // Safety check for data
  if (!data || !data.labels || !data.datasets || data.datasets.length === 0) {
    console.warn("PieChartComponent received invalid data:", data)
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-muted-foreground">No valid data for pie chart</div>
      </div>
    )
  }

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || ""
            const value = context.raw as number
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = Math.round((value / total) * 100)
            return `${label}: ${percentage}% (${value})`
          },
        },
      },
    },
  }

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="h-[300px] w-[300px]">
        <Pie data={data} options={{ ...defaultOptions, ...options }} />
      </div>
    </div>
  )
}

export function ScatterChartComponent({ data, xLabel, yLabel, options = {} }: ChartProps) {
  // Format data for scatter plot if it's in the format with xValues and yValues
  const formattedData =
    data.xValues && data.yValues
      ? {
          datasets: [
            {
              label: data.datasets?.[0]?.label || "Scatter Data",
              data: data.xValues.map((x: number, i: number) => ({ x, y: data.yValues[i] })),
              backgroundColor: data.datasets?.[0]?.backgroundColor || "rgba(75, 192, 192, 0.6)",
              borderColor: data.datasets?.[0]?.borderColor || "rgba(75, 192, 192, 1)",
            },
          ],
        }
      : data

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || ""
            return `${label}: (${context.parsed.x}, ${context.parsed.y})`
          },
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        title: {
          display: !!xLabel,
          text: xLabel,
        },
      },
      y: {
        title: {
          display: !!yLabel,
          text: yLabel,
        },
      },
    },
  }

  return (
    <div className="h-full w-full">
      <Scatter data={formattedData} options={{ ...defaultOptions, ...options }} />
    </div>
  )
}

export function BoxPlotComponent({ data, xLabel, yLabel }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !data || !data.boxplotData) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    const boxplotData = data.boxplotData
    const width = canvasRef.current.width
    const height = canvasRef.current.height
    const padding = 40
    const boxWidth = 100

    // Calculate scale
    const min = Math.min(boxplotData.min, ...(boxplotData.outliers || []))
    const max = Math.max(boxplotData.max, ...(boxplotData.outliers || []))
    const range = max - min
    const scale = (height - padding * 2) / (range || 1)

    // Draw y-axis
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.stroke()

    // Draw y-axis ticks and labels
    const numTicks = 5
    for (let i = 0; i <= numTicks; i++) {
      const y = height - padding - (i / numTicks) * (height - padding * 2)
      const value = min + (i / numTicks) * range

      ctx.beginPath()
      ctx.moveTo(padding - 5, y)
      ctx.lineTo(padding, y)
      ctx.stroke()

      ctx.fillStyle = "#666"
      ctx.textAlign = "right"
      ctx.fillText(value.toFixed(1), padding - 8, y + 4)
    }

    // Draw y-axis label
    if (yLabel) {
      ctx.save()
      ctx.translate(15, height / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = "center"
      ctx.fillText(yLabel, 0, 0)
      ctx.restore()
    }

    // Calculate positions
    const centerX = width / 2
    const minY = height - padding - (boxplotData.min - min) * scale
    const q1Y = height - padding - (boxplotData.q1 - min) * scale
    const medianY = height - padding - (boxplotData.median - min) * scale
    const q3Y = height - padding - (boxplotData.q3 - min) * scale
    const maxY = height - padding - (boxplotData.max - min) * scale

    // Draw box
    ctx.fillStyle = "rgba(75, 192, 192, 0.2)"
    ctx.fillRect(centerX - boxWidth / 2, q3Y, boxWidth, q1Y - q3Y)

    // Draw median line
    ctx.beginPath()
    ctx.moveTo(centerX - boxWidth / 2, medianY)
    ctx.lineTo(centerX + boxWidth / 2, medianY)
    ctx.strokeStyle = "rgba(75, 192, 192, 1)"
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw whiskers
    ctx.beginPath()
    ctx.moveTo(centerX, q3Y)
    ctx.lineTo(centerX, maxY)
    ctx.moveTo(centerX, q1Y)
    ctx.lineTo(centerX, minY)
    ctx.strokeStyle = "rgba(75, 192, 192, 1)"
    ctx.lineWidth = 1
    ctx.stroke()

    // Draw min and max horizontal lines
    ctx.beginPath()
    ctx.moveTo(centerX - boxWidth / 4, maxY)
    ctx.lineTo(centerX + boxWidth / 4, maxY)
    ctx.moveTo(centerX - boxWidth / 4, minY)
    ctx.lineTo(centerX + boxWidth / 4, minY)
    ctx.stroke()

    // Draw outliers if any
    if (boxplotData.outliers && boxplotData.outliers.length > 0) {
      boxplotData.outliers.forEach((outlier: number) => {
        const outlierY = height - padding - (outlier - min) * scale
        ctx.beginPath()
        ctx.arc(centerX, outlierY, 4, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(255, 99, 132, 0.8)"
        ctx.fill()
      })
    }

    // Draw box plot label
    ctx.fillStyle = "#333"
    ctx.textAlign = "center"
    ctx.fillText("Box Plot", centerX, height - padding / 2)

    // Draw statistics
    ctx.textAlign = "left"
    ctx.fillText(`Min: ${boxplotData.min.toFixed(2)}`, width - 150, padding + 20)
    ctx.fillText(`Q1: ${boxplotData.q1.toFixed(2)}`, width - 150, padding + 40)
    ctx.fillText(`Median: ${boxplotData.median.toFixed(2)}`, width - 150, padding + 60)
    ctx.fillText(`Q3: ${boxplotData.q3.toFixed(2)}`, width - 150, padding + 80)
    ctx.fillText(`Max: ${boxplotData.max.toFixed(2)}`, width - 150, padding + 100)
  }, [data, xLabel, yLabel])

  return (
    <div className="h-full w-full flex items-center justify-center">
      <canvas ref={canvasRef} width={800} height={400} className="w-full h-full" />
    </div>
  )
}

export function HeatmapComponent({ data, xLabel, yLabel }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !data || !data.matrix) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    const matrix = data.matrix
    const rowLabels = data.rowLabels || []
    const colLabels = data.colLabels || []
    const width = canvasRef.current.width
    const height = canvasRef.current.height
    const padding = 60

    // Calculate cell size
    const cellWidth = (width - padding * 2) / matrix[0].length
    const cellHeight = (height - padding * 2) / matrix.length

    // Draw heatmap cells
    matrix.forEach((row: number[], rowIndex: number) => {
      row.forEach((value: number, colIndex: number) => {
        // Normalize value between 0 and 1
        const normalizedValue = (value + 1) / 2 // Assuming correlation values between -1 and 1

        // Calculate color (blue to white to red)
        let r, g, b
        if (normalizedValue < 0.5) {
          // Blue to white
          const factor = normalizedValue * 2
          r = Math.round(255 * factor)
          g = Math.round(255 * factor)
          b = 255
        } else {
          // White to red
          const factor = (normalizedValue - 0.5) * 2
          r = 255
          g = Math.round(255 * (1 - factor))
          b = Math.round(255 * (1 - factor))
        }

        const color = `rgb(${r}, ${g}, ${b})`

        // Draw cell
        ctx.fillStyle = color
        ctx.fillRect(padding + colIndex * cellWidth, padding + rowIndex * cellHeight, cellWidth, cellHeight)

        // Draw cell value
        ctx.fillStyle = "black"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.font = "10px Arial"
        ctx.fillText(
          value.toFixed(2),
          padding + colIndex * cellWidth + cellWidth / 2,
          padding + rowIndex * cellHeight + cellHeight / 2,
        )
      })
    })

    // Draw row labels
    rowLabels.forEach((label: string, index: number) => {
      ctx.fillStyle = "#333"
      ctx.textAlign = "right"
      ctx.textBaseline = "middle"
      ctx.font = "12px Arial"
      ctx.fillText(label, padding - 10, padding + index * cellHeight + cellHeight / 2)
    })

    // Draw column labels
    colLabels.forEach((label: string, index: number) => {
      ctx.fillStyle = "#333"
      ctx.textAlign = "center"
      ctx.textBaseline = "bottom"
      ctx.font = "12px Arial"
      ctx.save()
      ctx.translate(padding + index * cellWidth + cellWidth / 2, padding - 10)
      ctx.rotate(-Math.PI / 4)
      ctx.fillText(label, 0, 0)
      ctx.restore()
    })

    // Draw title
    ctx.fillStyle = "#333"
    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    ctx.font = "16px Arial"
    ctx.fillText("Correlation Heatmap", width / 2, 10)
  }, [data, xLabel, yLabel])

  return (
    <div className="h-full w-full flex items-center justify-center">
      <canvas ref={canvasRef} width={800} height={400} className="w-full h-full" />
    </div>
  )
}

