"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TermTooltip } from "./term-explainer"
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"

interface StatisticsPanelProps {
  statistics: Record<string, any>
}

export function StatisticsPanel({ statistics }: StatisticsPanelProps) {
  if (!statistics || Object.keys(statistics).length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">No statistics available</p>
      </div>
    )
  }

  // Format number with appropriate precision
  const formatNumber = (value: number) => {
    if (value === undefined || value === null) return "N/A"

    // Handle integers
    if (Number.isInteger(value)) return value.toLocaleString()

    // Handle decimals with appropriate precision
    const absValue = Math.abs(value)
    if (absValue >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 0 })
    if (absValue >= 100) return value.toLocaleString(undefined, { maximumFractionDigits: 1 })
    if (absValue >= 10) return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
    if (absValue >= 1) return value.toLocaleString(undefined, { maximumFractionDigits: 3 })
    return value.toLocaleString(undefined, { maximumFractionDigits: 4 })
  }

  // Get trend indicator based on comparison
  const getTrendIndicator = (value: number, compareValue: number) => {
    if (!compareValue || value === compareValue) return <Minus className="h-4 w-4 text-gray-400" />
    return value > compareValue ? (
      <ArrowUpRight className="h-4 w-4 text-green-500" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-red-500" />
    )
  }

  // Get nice display name for statistic key
  const getDisplayName = (key: string) => {
    // Handle special cases
    if (key === "stdDev" || key === "standardDeviation") return "Standard Deviation"
    if (key === "q1" || key === "quartile1") return "First Quartile"
    if (key === "q3" || key === "quartile3") return "Third Quartile"
    if (key === "iqr") return "Interquartile Range"

    // Convert camelCase to Title Case
    return key
      .replace(/([A-Z])/g, " $1") // Insert space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
  }

  // Organize statistics into categories
  const centralTendency = ["mean", "median", "mode"]
  const dispersion = ["min", "max", "range", "variance", "stdDev", "standardDeviation", "iqr"]
  const distribution = ["q1", "quartile1", "q3", "quartile3", "skewness", "kurtosis"]
  const other = ["count", "sum", "n", "total"]

  // Group statistics
  const groups: Record<string, string[]> = {
    "Central Tendency": [],
    Dispersion: [],
    Distribution: [],
    Other: [],
  }

  Object.keys(statistics).forEach((key) => {
    if (centralTendency.some((term) => key.toLowerCase().includes(term.toLowerCase()))) {
      groups["Central Tendency"].push(key)
    } else if (dispersion.some((term) => key.toLowerCase().includes(term.toLowerCase()))) {
      groups["Dispersion"].push(key)
    } else if (distribution.some((term) => key.toLowerCase().includes(term.toLowerCase()))) {
      groups["Distribution"].push(key)
    } else if (other.some((term) => key.toLowerCase().includes(term.toLowerCase()))) {
      groups["Other"].push(key)
    } else {
      groups["Other"].push(key)
    }
  })

  return (
    <div className="space-y-6 p-4 max-h-[450px] overflow-auto">
      {Object.entries(groups).map(([groupName, keys]) => {
        if (keys.length === 0) return null

        return (
          <div key={groupName} className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">{groupName}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {keys.map((key) => (
                <Card key={key} className="overflow-hidden">
                  <CardHeader className="p-3 pb-0">
                    <CardTitle className="text-sm">
                      <TermTooltip term={key}>{getDisplayName(key)}</TermTooltip>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold tabular-nums">{formatNumber(statistics[key])}</div>
                      {getTrendIndicator(
                        statistics[key],
                        statistics[`previous${key.charAt(0).toUpperCase() + key.slice(1)}`],
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

