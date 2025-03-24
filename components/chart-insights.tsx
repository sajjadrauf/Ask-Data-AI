import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb } from "lucide-react"

interface ChartInsightsProps {
  insights: string[]
}

export function ChartInsights({ insights }: ChartInsightsProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-md flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-2">
          {insights.map((insight, index) => (
            <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

