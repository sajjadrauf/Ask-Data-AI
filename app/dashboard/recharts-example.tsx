"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RechartsVisualization } from "@/components/recharts-integration"
import { RechartsCustomizer } from "@/components/recharts-customizer"

export default function RechartsExample() {
  const chartRef = useRef<HTMLDivElement>(null)

  // Sample data for demonstration
  const [chartConfig, setChartConfig] = useState({
    type: "bar",
    title: "Sales Performance by Region",
    description: "Quarterly sales data across different regions",
    xLabel: "Region",
    yLabel: "Sales ($)",
    colors: ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b"],
    data: {
      labels: ["North", "South", "East", "West", "Central"],
      datasets: [
        {
          label: "Q1 Sales",
          data: [12500, 19000, 15000, 17500, 14000],
          backgroundColor: "#4f46e5",
        },
        {
          label: "Q2 Sales",
          data: [14000, 21000, 16500, 19000, 15500],
          backgroundColor: "#06b6d4",
        },
        {
          label: "Q3 Sales",
          data: [15500, 22500, 18000, 20500, 17000],
          backgroundColor: "#10b981",
        },
        {
          label: "Q4 Sales",
          data: [18000, 25000, 20000, 23000, 19500],
          backgroundColor: "#f59e0b",
        },
      ],
    },
  })

  // Handle chart configuration changes
  const handleConfigChange = (newConfig: any) => {
    setChartConfig({
      ...chartConfig,
      ...newConfig,
    })
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-bold">Recharts Visualization Example</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RechartsVisualization
            ref={chartRef}
            data={chartConfig.data}
            type={chartConfig.type}
            title={chartConfig.title}
            description={chartConfig.description}
            xLabel={chartConfig.xLabel}
            yLabel={chartConfig.yLabel}
            colors={chartConfig.colors}
          />
        </div>

        <div className="lg:col-span-1">
          <RechartsCustomizer chartRef={chartRef} chartConfig={chartConfig} onConfigChange={handleConfigChange} />
        </div>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Why Recharts?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              Recharts is a modern charting library built with React and D3, offering several advantages over Chart.js:
            </p>

            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>React-native implementation</strong> - Built specifically for React applications with proper
                component lifecycle management
              </li>
              <li>
                <strong>Declarative API</strong> - More intuitive and React-like API compared to the imperative approach
                of Chart.js
              </li>
              <li>
                <strong>Better TypeScript support</strong> - First-class TypeScript definitions for improved developer
                experience
              </li>
              <li>
                <strong>Responsive by default</strong> - Built-in responsive container that adapts to parent size
              </li>
              <li>
                <strong>Customization</strong> - More flexible customization options with React components
              </li>
              <li>
                <strong>Animation</strong> - Smooth, customizable animations powered by D3
              </li>
              <li>
                <strong>Active community</strong> - Well-maintained with regular updates and improvements
              </li>
            </ul>

            <p>
              Recharts makes it easier to create interactive, animated data visualizations that integrate seamlessly
              with your React application.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

