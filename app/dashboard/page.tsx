"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { VisualizationPanel } from "@/components/visualization-panel"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Settings, BarChart3, RefreshCw, HelpCircle, Database, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ChatInterface } from "@/components/chat-interface"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Dashboard() {
  const [fileInfo, setFileInfo] = useState<{
    name: string
    size: string
    type: string
    date: string
    id: string
    rowCount: number
  } | null>(null)
  const [currentChart, setCurrentChart] = useState<any>(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const [insights, setInsights] = useState<string[]>([])
  const [statistics, setStatistics] = useState<any>({})
  const [dataLoadAttempts, setDataLoadAttempts] = useState(0)
  const [dataLoadError, setDataLoadError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4")
  const [activeTab, setActiveTab] = useState<"analyze" | "help">("analyze")
  const router = useRouter()
  const { toast } = useToast()
  const [data, setData] = useState<any[] | null>(null) // Added data state

  useEffect(() => {
    // Get file info from localStorage
    const fileId = localStorage.getItem("fileId")
    const fileName = localStorage.getItem("fileName")
    const model = localStorage.getItem("openai_model") || "gpt-4"

    if (!fileId || !fileName) {
      toast({
        title: "No data found",
        description: "Please upload a file first",
        variant: "destructive",
      })
      router.push("/")
      return
    }

    setSelectedModel(model)
    console.log("Dashboard loaded with file ID:", fileId)
    console.log("File name:", fileName)
    console.log("Using model:", model)

    // Set file info immediately
    setFileInfo({
      id: fileId,
      name: fileName,
      size: localStorage.getItem("fileSize") || "0",
      type: localStorage.getItem("fileDataType") || "csv",
      date: localStorage.getItem("fileUploadDate") || new Date().toISOString(),
      rowCount: Number.parseInt(localStorage.getItem("fileRowCount") || "0", 10),
    })

    // Simulate processing time - shorter to improve UX
    const timer = setTimeout(() => {
      setIsProcessing(false)
      console.log("Processing complete")
    }, 1000)

    return () => clearTimeout(timer)
  }, [router, toast, dataLoadAttempts])

  const handleChatResponse = (response: any) => {
    // Update the chart based on the chat response
    console.log("Received chat response:", response)

    if (response.chart) {
      // Ensure the chart has all required properties
      const chart = {
        ...response.chart,
        // Make sure these properties exist
        title: response.chart.title || "Data Visualization",
        description: response.chart.description || "Analysis of your data",
        type: response.chart.type || "bar",
        data: response.chart.data || { labels: [], datasets: [] },
      }

      setCurrentChart(chart)
    }

    // Update insights if provided
    if (response.insights && Array.isArray(response.insights)) {
      console.log("Received insights:", response.insights)
      setInsights(response.insights)
    }

    // Update statistics if provided
    if (response.statistics) {
      console.log("Received statistics:", response.statistics)
      setStatistics(response.statistics)
    }

    // Update data if provided
    if (response.data) {
      console.log("Received data sample:", response.data.length, "rows")
      setData(response.data)
    }
  }

  const handleReloadData = () => {
    setIsProcessing(true)
    setDataLoadError(null)
    setDataLoadAttempts((prev) => prev + 1)

    // This will trigger the useEffect to run again and attempt to reload the data
    toast({
      title: "Reloading data",
      description: "Attempting to reload your data...",
    })
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <header className="border-b bg-white dark:bg-gray-950 shadow-sm flex-shrink-0">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
              AskData AI Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {fileInfo && (
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{fileInfo.name}</span>
                <span className="text-xs">({fileInfo.rowCount.toLocaleString()} rows)</span>
              </div>
            )}
            {dataLoadError && (
              <Button variant="outline" size="sm" onClick={handleReloadData} className="flex items-center gap-1">
                <RefreshCw className="h-4 w-4" />
                <span>Reload Data</span>
              </Button>
            )}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <HelpCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Help</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>How to Use AskData AI</DialogTitle>
                  <DialogDescription>
                    AskData AI helps you analyze your data through natural language. Here's how to get started.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">1. Ask Questions Naturally</h3>
                    <p className="text-sm text-muted-foreground">
                      You don't need to know SQL or data analysis. Just ask questions in plain English like:
                    </p>
                    <ul className="text-sm space-y-1 ml-5 list-disc">
                      <li>"What are the top 5 products by sales?"</li>
                      <li>"Show me the trend of revenue over time"</li>
                      <li>"Compare sales across different regions"</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">2. Explore Your Data</h3>
                    <p className="text-sm text-muted-foreground">
                      Use the Data Explorer tab to browse your data and understand its structure before asking
                      questions.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">3. Use Guided Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Not sure what to ask? The Guided Analysis tab offers pre-built analysis options tailored to your
                      data.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium">4. Customize Your Charts</h3>
                    <p className="text-sm text-muted-foreground">
                      Use the Customize tab in the visualization panel to change colors, labels, and other chart
                      properties.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Settings</DialogTitle>
                  <DialogDescription>Configure your data analysis preferences</DialogDescription>
                </DialogHeader>
                {/* Settings content would go here */}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-4 flex h-[calc(100vh-4rem)] overflow-hidden">
        <div className="w-1/3 pr-4 flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <ChatInterface
              onResponse={handleChatResponse}
              isAnalyzing={isProcessing}
              fileInfo={fileInfo}
              model={selectedModel}
            />
          </div>
        </div>
        <div className="w-2/3 flex h-full overflow-hidden">
          {isProcessing ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
                <h3 className="text-lg font-medium mb-2">Processing Your Data</h3>
                <p className="text-gray-500 dark:text-gray-400">We're preparing your data for analysis...</p>
              </div>
            </div>
          ) : dataLoadError ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <div className="text-amber-500 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <h3 className="text-xl font-medium mt-4">Data Loading Error</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">{dataLoadError}</p>
                  <Button onClick={handleReloadData} className="mt-4">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Data
                  </Button>
                  <Button variant="outline" className="mt-2 ml-2" onClick={() => router.push("/")}>
                    Return to Upload
                  </Button>
                </div>
              </div>
            </div>
          ) : currentChart ? (
            <div className="w-full h-full">
              <VisualizationPanel
                data={{
                  chart: currentChart,
                  insights: insights,
                  statistics: statistics,
                  data: data,
                }}
                isLoading={false}
                onResponse={handleChatResponse}
              />
            </div>
          ) : (
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl">Welcome to AskData AI</CardTitle>
                <CardDescription>Your data is ready for analysis. Here's how to get started:</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="analyze" onValueChange={(value) => setActiveTab(value as any)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="analyze">Get Started</TabsTrigger>
                    <TabsTrigger value="help">Tips & Examples</TabsTrigger>
                  </TabsList>
                  <TabsContent value="analyze" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4 hover:border-primary hover:bg-primary/5 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="h-5 w-5 text-primary" />
                          <h3 className="font-medium">Explore Your Data</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Browse your data to understand its structure before asking questions.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            document.querySelector('[value="explore"]')?.dispatchEvent(new MouseEvent("click"))
                          }
                        >
                          Open Data Explorer
                        </Button>
                      </div>
                      <div className="border rounded-lg p-4 hover:border-primary hover:bg-primary/5 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                          <HelpCircle className="h-5 w-5 text-primary" />
                          <h3 className="font-medium">Guided Analysis</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Not sure what to ask? Use pre-built analysis options tailored to your data.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            document.querySelector('[value="guide"]')?.dispatchEvent(new MouseEvent("click"))
                          }
                        >
                          Open Guided Analysis
                        </Button>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4 hover:border-primary hover:bg-primary/5 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <h3 className="font-medium">Ask Questions Naturally</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        You don't need to know SQL or data analysis. Just ask questions in plain English:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={() => {
                            const chatInput = document.querySelector(
                              'input[placeholder*="Ask about your data"]',
                            ) as HTMLInputElement
                            if (chatInput) {
                              chatInput.value = "What are the main trends in this data?"
                              chatInput.focus()
                            }
                          }}
                        >
                          What are the main trends in this data?
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={() => {
                            const chatInput = document.querySelector(
                              'input[placeholder*="Ask about your data"]',
                            ) as HTMLInputElement
                            if (chatInput) {
                              chatInput.value = "Show me the top 5 performers"
                              chatInput.focus()
                            }
                          }}
                        >
                          Show me the top 5 performers
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={() => {
                            const chatInput = document.querySelector(
                              'input[placeholder*="Ask about your data"]',
                            ) as HTMLInputElement
                            if (chatInput) {
                              chatInput.value = "Compare values across categories"
                              chatInput.focus()
                            }
                          }}
                        >
                          Compare values across categories
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="justify-start"
                          onClick={() => {
                            const chatInput = document.querySelector(
                              'input[placeholder*="Ask about your data"]',
                            ) as HTMLInputElement
                            if (chatInput) {
                              chatInput.value = "What insights can you find in this data?"
                              chatInput.focus()
                            }
                          }}
                        >
                          What insights can you find in this data?
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="help" className="space-y-4 mt-4">
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h3 className="font-medium mb-2">Tips for Better Results</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground ml-5 list-disc">
                          <li>
                            Be specific about what you want to see (e.g., "Show me sales by region as a bar chart")
                          </li>
                          <li>Mention column names from your data for more accurate results</li>
                          <li>
                            Ask for specific time periods if relevant (e.g., "Show me trends for the last 6 months")
                          </li>
                          <li>Request specific insights (e.g., "What's driving the increase in sales?")</li>
                        </ul>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h3 className="font-medium mb-2">Example Questions</h3>
                        <div className="space-y-2 text-sm">
                          <div className="p-2 bg-muted rounded-md">
                            "What's the distribution of sales across different product categories?"
                          </div>
                          <div className="p-2 bg-muted rounded-md">
                            "Show me the correlation between customer age and purchase amount"
                          </div>
                          <div className="p-2 bg-muted rounded-md">
                            "Which region had the highest growth rate compared to last year?"
                          </div>
                          <div className="p-2 bg-muted rounded-md">
                            "Create a pie chart showing the market share of each product"
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}

