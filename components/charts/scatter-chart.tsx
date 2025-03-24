"use client"

import { useEffect, useRef } from "react"
import { Chart as ChartJS, LinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js"
import { Scatter } from "react-chartjs-2"

// Register ChartJS components
ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend)

interface ScatterChartProps {
  data: any
}

export function ScatterChart({ data }: ScatterChartProps) {
  const chartRef = useRef<ChartJS>(null)

  // Apply any customizations from props
  useEffect(() => {
    if (chartRef.current) {
      // You can customize the chart here if needed
    }
  }, [data])

  // Set chart options with better label visibility
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || ""
            if (label) {
              label += ": "
            }
            if (context.parsed.y !== null && context.parsed.x !== null) {
              label += `(${new Intl.NumberFormat("en-US", {
                maximumFractionDigits: 2,
              }).format(context.parsed.x)}, ${new Intl.NumberFormat("en-US", {
                maximumFractionDigits: 2,
              }).format(context.parsed.y)})`
            }
            return label
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 11,
          },
        },
        title: {
          display: true,
          text: data.xLabel || "X Axis",
          font: {
            size: 12,
            weight: "bold",
          },
          padding: {
            top: 10,
          },
        },
      },
      y: {
        ticks: {
          font: {
            size: 11,
          },
        },
        title: {
          display: true,
          text: data.yLabel || "Y Axis",
          font: {
            size: 12,
            weight: "bold",
          },
          padding: {
            bottom: 10,
          },
        },
      },
    },
    layout: {
      padding: {
        left: 10,
        right: 20,
        top: 0,
        bottom: 10,
      },
    },
  }

  // Make sure the chart container has the correct class for exporting:
  return (
    <div className="h-full w-full chart-container min-h-[450px]">
      <Scatter ref={chartRef} data={data.data} options={options} />
    </div>
  )
}

