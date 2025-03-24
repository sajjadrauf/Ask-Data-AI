"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HelpCircle, X } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TermExplainerProps {
  term: string
  children: React.ReactNode
}

// Component for inline term explanations
export function TermTooltip({ term, children }: TermExplainerProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="border-b border-dotted border-primary cursor-help">{children}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{getTermDefinition(term)}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Glossary component for data analysis terms
export function DataGlossary() {
  const [isOpen, setIsOpen] = useState(false)

  const commonTerms = [
    "mean",
    "median",
    "mode",
    "standard deviation",
    "correlation",
    "quartile",
    "outlier",
    "distribution",
    "regression",
    "variance",
    "p-value",
    "histogram",
    "scatter plot",
    "box plot",
    "bar chart",
    "pie chart",
  ]

  return (
    <>
      <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={() => setIsOpen(true)}>
        <HelpCircle className="h-4 w-4" />
        <span>Data Terms</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Data Analysis Glossary</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Common terms used in data analysis</CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto flex-1">
              <div className="space-y-4">
                {commonTerms.map((term) => (
                  <div key={term} className="border-b pb-2">
                    <h3 className="font-medium capitalize">{term}</h3>
                    <p className="text-sm text-muted-foreground">{getTermDefinition(term)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}

// Helper function to get term definitions
function getTermDefinition(term: string): string {
  const definitions: Record<string, string> = {
    mean: "The average of a set of numbers, calculated by adding all values and dividing by the count of values.",
    median:
      "The middle value in a sorted list of numbers. If there are an even number of values, it's the average of the two middle values.",
    mode: "The most frequently occurring value in a dataset.",
    "standard deviation":
      "A measure of how spread out the values are from the mean. A low standard deviation indicates values are close to the mean.",
    correlation: "A statistical measure that expresses the extent to which two variables are linearly related.",
    quartile: "Values that divide a dataset into four equal parts. Q1 (25%), Q2 (median, 50%), and Q3 (75%).",
    outlier: "A data point that differs significantly from other observations in a dataset.",
    distribution: "The pattern of values in a dataset, showing how frequently each value occurs.",
    regression: "A statistical method for examining relationships between variables, often used for prediction.",
    variance:
      "A measure of how far each value in the dataset is from the mean, calculated as the average of squared differences from the mean.",
    "p-value": "A measure used in hypothesis testing to help determine statistical significance.",
    histogram:
      "A chart that shows the distribution of a dataset by grouping data into bins and showing the frequency of each bin.",
    "scatter plot": "A chart that shows the relationship between two variables by plotting points on a graph.",
    "box plot":
      "A chart that displays the distribution of a dataset by showing the minimum, first quartile, median, third quartile, and maximum.",
    "bar chart": "A chart that uses rectangular bars to show comparisons among categories.",
    "pie chart": "A circular chart divided into slices to illustrate numerical proportions.",
    // Add more terms as needed
  }

  // Return the definition or a default message
  return definitions[term.toLowerCase()] || "No definition available for this term."
}

