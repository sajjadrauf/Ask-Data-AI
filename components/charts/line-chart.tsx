"use client"

import { useEffect, useRef } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Line } from "react-chartjs-2"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface LineChartProps {
  data: any
}

export function LineChart({ data }: LineChartProps) {
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
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("en-US", {
                maximumFractionDigits: 2,
              }).format(context.parsed.y)
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
          maxRotation: 45,
          minRotation: 45,
        },
        title: {
          display: !!data.xLabel,
          text: data.xLabel || "",
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
        beginAtZero: data.beginAtZero !== false,
        ticks: {
          font: {
            size: 11,
          },
          callback: (value: any) =>
            new Intl.NumberFormat("en-US", {
              maximumFractionDigits: 2,
            }).format(value),
        },
        title: {
          display: !!data.yLabel,
          text: data.yLabel || "",
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
    <div className="h-full w-full chart-container" style={{ position: "relative", minHeight: "400px" }}>
      <Line ref={chartRef} data={data.data} options={options} />
    </div>
  )
}

