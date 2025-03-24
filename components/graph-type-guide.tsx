"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart2, LineChart, PieChart, ScatterChart, BoxSelect, Grid3X3 } from "lucide-react"

export function GraphTypeGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chart Type Guide</CardTitle>
        <CardDescription>Learn which chart type is best for your data analysis</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="bar">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="bar" className="flex flex-col items-center py-2">
              <BarChart2 className="h-4 w-4 mb-1" />
              <span className="text-xs">Bar</span>
            </TabsTrigger>
            <TabsTrigger value="line" className="flex flex-col items-center py-2">
              <LineChart className="h-4 w-4 mb-1" />
              <span className="text-xs">Line</span>
            </TabsTrigger>
            <TabsTrigger value="pie" className="flex flex-col items-center py-2">
              <PieChart className="h-4 w-4 mb-1" />
              <span className="text-xs">Pie</span>
            </TabsTrigger>
            <TabsTrigger value="scatter" className="flex flex-col items-center py-2">
              <ScatterChart className="h-4 w-4 mb-1" />
              <span className="text-xs">Scatter</span>
            </TabsTrigger>
            <TabsTrigger value="box" className="flex flex-col items-center py-2">
              <BoxSelect className="h-4 w-4 mb-1" />
              <span className="text-xs">Box</span>
            </TabsTrigger>
            <TabsTrigger value="heat" className="flex flex-col items-center py-2">
              <Grid3X3 className="h-4 w-4 mb-1" />
              <span className="text-xs">Heat</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="bar" className="p-4">
            <h3 className="font-medium mb-2">Bar Chart</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Bar charts compare values across categories. Taller bars represent higher values.
            </p>
            <h4 className="text-sm font-medium mt-3">Best for:</h4>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Comparing values across categories</li>
              <li>Showing rankings (e.g., top 5 products)</li>
              <li>Displaying distributions</li>
            </ul>
            <h4 className="text-sm font-medium mt-3">Example questions:</h4>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>"What are the top 5 products by sales?"</li>
              <li>"Compare revenue across different regions"</li>
              <li>"Show me the distribution of customer ages"</li>
            </ul>
          </TabsContent>
          <TabsContent value="line" className="p-4">
            <h3 className="font-medium mb-2">Line Chart</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Line charts show trends over time or sequences. Rising lines indicate increasing values.
            </p>
            <h4 className="text-sm font-medium mt-3">Best for:</h4>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Showing trends over time</li>
              <li>Comparing multiple trends</li>
              <li>Visualizing continuous data</li>
            </ul>
            <h4 className="text-sm font-medium mt-3">Example questions:</h4>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>"Show me sales trends over the past year"</li>
              <li>"Compare monthly revenue for different product categories"</li>
              <li>"What's the growth pattern of our customer base?"</li>
            </ul>
          </TabsContent>
          <TabsContent value="pie" className="p-4">
            <h3 className="font-medium mb-2">Pie Chart</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Pie charts show proportions of a whole. Larger slices represent higher percentages.
            </p>
            <h4 className="text-sm font-medium mt-3">Best for:</h4>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Showing parts of a whole</li>
              <li>Displaying percentage distributions</li>
              <li>Comparing proportions (with few categories)</li>
            </ul>
            <h4 className="text-sm font-medium mt-3">Example questions:</h4>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>"What's the breakdown of sales by product category?"</li>
              <li>"Show me the market share of each region"</li>
              <li>"How is our budget allocated across departments?"</li>
            </ul>
          </TabsContent>
          <TabsContent value="scatter" className="p-4">
            <h3 className="font-medium mb-2">Scatter Plot</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Scatter plots show relationships between two variables. Patterns indicate correlations.
            </p>
            <h4 className="text-sm font-medium mt-3">Best for:</h4>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Finding correlations between variables</li>
              <li>Identifying outliers</li>
              <li>Visualizing distribution patterns</li>
            </ul>
            <h4 className="text-sm font-medium mt-3">Example questions:</h4>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>"Is there a correlation between price and sales volume?"</li>
              <li>"How does customer age relate to purchase amount?"</li>
              <li>"Show me the relationship between marketing spend and revenue"</li>
            </ul>
          </TabsContent>
          <TabsContent value="box" className="p-4">
            <h3 className="font-medium mb-2">Box Plot</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Box plots show distribution statistics including median, quartiles, and outliers.
            </p>
            <h4 className="text-sm font-medium mt-3">Best for:</h4>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Comparing distributions across groups</li>
              <li>Identifying outliers</li>
              <li>Showing data spread and skewness</li>
            </ul>
            <h4 className="text-sm font-medium mt-3">Example questions:</h4>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>"Compare the distribution of sales across regions"</li>
              <li>"Show me the range of customer ages by segment"</li>
              <li>"Are there outliers in our product pricing?"</li>
            </ul>
          </TabsContent>
          <TabsContent value="heat" className="p-4">
            <h3 className="font-medium mb-2">Heat Map</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Heatmaps use color intensity to show values across two categories.
            </p>
            <h4 className="text-sm font-medium mt-3">Best for:</h4>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>Showing patterns across two dimensions</li>
              <li>Visualizing complex correlations</li>
              <li>Identifying hotspots or clusters</li>
            </ul>
            <h4 className="text-sm font-medium mt-3">Example questions:</h4>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li>"Show me sales performance by product and region"</li>
              <li>"What's the correlation matrix between all our metrics?"</li>
              <li>"Display customer activity by day of week and hour"</li>
            </ul>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

