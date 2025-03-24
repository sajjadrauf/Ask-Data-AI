"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Lightbulb, AlertCircle, TrendingUp, Info } from "lucide-react"

interface Insight {
  type: "info" | "warning" | "success" | "error"
  title: string
  description: string
}

interface InsightsListProps {
  insights: Insight[]
}

export function InsightsList({ insights }: InsightsListProps) {
  if (!insights || insights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <Info className="h-12 w-12 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium">No Insights Available</h3>
        <p className="text-muted-foreground">Try asking a different question to generate insights</p>
      </div>
    )
  }

  // Get icon based on insight type
  const getIcon = (type: string) => {
    switch (type) {
      case "info":
        return <Info className="h-4 w-4" />
      case "warning":
        return <AlertCircle className="h-4 w-4" />
      case "success":
        return <TrendingUp className="h-4 w-4" />
      case "error":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Lightbulb className="h-4 w-4" />
    }
  }

  // Get variant based on insight type
  const getVariant = (type: string): "default" | "destructive" => {
    switch (type) {
      case "error":
        return "destructive"
      default:
        return "default"
    }
  }

  return (
    <div className="space-y-4 p-4 max-h-[450px] overflow-auto">
      {insights.map((insight, index) => (
        <Alert key={index} variant={getVariant(insight.type)}>
          {getIcon(insight.type)}
          <AlertTitle>{insight.title}</AlertTitle>
          <AlertDescription>{insight.description}</AlertDescription>
        </Alert>
      ))}
    </div>
  )
}

