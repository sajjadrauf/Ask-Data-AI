"use client"

import { useEffect, useRef } from "react"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import { Pie } from "react-chartjs-2"

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend)

interface PieChartProps {
  data: any
}

export function PieChart({ data }: PieChartProps) {
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
        position: "right" as const,
        labels: {
          padding: 20,
          font: {
            size: 12,
          },
          generateLabels: (chart: any) => {
            const data = chart.data
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const value = data.datasets[0].data[i]
                const total = data.datasets[0].data.reduce((acc: number, val: number) => acc + val, 0)
                const percentage = Math.round((value / total) * 100)
                return {
                  text: `${label}: ${percentage}%`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].backgroundColor[i],
                  lineWidth: 0,
                  index: i,
                }
              })
            }
            return []
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.parsed
            const total = context.dataset.data.reduce((acc: number, val: number) => acc + val, 0)
            const percentage = Math.round((value / total) * 100)
            return `${context.label}: ${percentage}% (${value})`
          },
        },
      },
    },
    layout: {
      padding: {
        left: 10,
        right: 20,
        top: 10,
        bottom: 10,
      },
    },
  }

  // Make sure the chart container has the correct class for exporting:
  return (
    <div
      className="h-full w-full flex items-center justify-center py-8 px-4 chart-container"
      style={{ position: "relative", minHeight: "450px" }}
    >
      <div className="w-full max-w-[600px] aspect-square">
        <Pie ref={chartRef} data={data.data} options={options} />
      </div>
    </div>
  )
}

