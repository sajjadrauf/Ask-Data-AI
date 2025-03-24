"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileUp, X, AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { parseCSV } from "@/lib/csv-parser"
import { storeApiKey } from "@/lib/api-key-utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { storeWithRetry, clearFileData } from "@/lib/storage-utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Define file upload constraints
const FILE_SIZE_LIMIT = 5 * 1024 * 1024 // 5MB
const MAX_ROWS_LIMIT = 10000 // Maximum number of rows to process
const ALLOWED_FILE_TYPES = [".csv", "text/csv", "application/vnd.ms-excel"]

export function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadAttempted, setUploadAttempted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("upload")
  const [fileError, setFileError] = useState<string | null>(null)
  const [apiKeySaved, setApiKeySaved] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Debug function to check localStorage
  const debugLocalStorage = () => {
    console.log("DEBUG: Checking localStorage contents")

    // List all keys in localStorage
    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) keys.push(key)
    }
    console.log("All localStorage keys:", keys)

    // Check specific keys
    const fileId = localStorage.getItem("fileId")
    console.log("fileId in localStorage:", fileId)

    if (fileId) {
      console.log(`data_${fileId} exists:`, localStorage.getItem(`data_${fileId}`) !== null)
      console.log(`${fileId} exists:`, localStorage.getItem(fileId) !== null)
    }

    // Check file info
    console.log("fileName:", localStorage.getItem("fileName"))
    console.log("fileRowCount:", localStorage.getItem("fileRowCount"))
    console.log("openai_api_key exists:", localStorage.getItem("openai_api_key") !== null)
  }

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > FILE_SIZE_LIMIT) {
      return {
        valid: false,
        error: `File size exceeds the limit of ${(FILE_SIZE_LIMIT / (1024 * 1024)).toFixed(1)}MB`,
      }
    }

    // Check file type
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
    if (!ALLOWED_FILE_TYPES.includes(fileExtension) && !ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: "Only CSV files are supported",
      }
    }

    return { valid: true }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null)

    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      const validation = validateFile(selectedFile)

      if (!validation.valid) {
        setFileError(validation.error || "Invalid file")
        return
      }

      setFile(selectedFile)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setUploadProgress(0)
    setUploadAttempted(false)
    setFileError(null)
  }

  // Then update the handleUpload function to use these utilities
  const handleUploadInner = async (
    file: File,
    apiKey: string,
    toast: any,
    setActiveTab: (tab: string) => void,
    setIsUploading: (isUploading: boolean) => void,
    setUploadProgress: (progress: number) => void,
    setUploadAttempted: (attempted: boolean) => void,
    setIsLoading: (isLoading: boolean) => void,
    router: any,
    parseCSV: (fileContent: string) => any[],
    debugLocalStorage: () => void,
  ) => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    // Validate file again before processing
    const validation = validateFile(file)
    if (!validation.valid) {
      toast({
        title: "Invalid file",
        description: validation.error,
        variant: "destructive",
      })
      return
    }

    // Check if API key is set
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please set your OpenAI API key in the API Key tab before uploading.",
        variant: "destructive",
      })
      setActiveTab("api-key")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadAttempted(true)
    let progressInterval: NodeJS.Timeout | null = null

    try {
      // Start progress simulation
      progressInterval = setInterval(() => {
        setUploadProgress((prev: number) => {
          const newProgress = prev + 5
          if (newProgress >= 90) {
            if (progressInterval) clearInterval(progressInterval)
            return 90
          }
          return newProgress
        })
      }, 300)

      // Read the file content
      const fileContent = await file.text()
      console.log("File content read, converting CSV to JSON...")

      // Parse the CSV data into JSON
      const csvData = parseCSV(fileContent)
      console.log(`Converted ${csvData.length} rows of CSV data to JSON`)

      if (csvData.length === 0) {
        throw new Error("Failed to convert CSV to JSON or file is empty")
      }

      // Check if the data exceeds the row limit
      if (csvData.length > MAX_ROWS_LIMIT) {
        toast({
          title: "File too large",
          description: `Your file contains ${csvData.length} rows, which exceeds our limit of ${MAX_ROWS_LIMIT} rows. Processing a subset of the data.`,
          variant: "warning",
        })
        // Process only the first MAX_ROWS_LIMIT rows
        csvData.splice(MAX_ROWS_LIMIT)
      }

      // Generate a unique file ID
      const fileId = `file_${Date.now()}`
      console.log("Generated fileId:", fileId)

      // Clear any existing data
      debugLocalStorage()
      console.log("Clearing any existing data...")

      // Clear previous file data if it exists
      const previousFileId = localStorage.getItem("fileId")
      if (previousFileId) {
        clearFileData(previousFileId)
      }

      // Store the parsed data in localStorage with retry mechanism
      const { success, storedSize } = await storeWithRetry(`data_${fileId}`, csvData)

      if (!success) {
        throw new Error("Failed to store data after multiple attempts. Your browser may have insufficient storage.")
      }

      // Also store with the fileId directly for backward compatibility
      await storeWithRetry(fileId, csvData)

      // Set progress to 100%
      setUploadProgress(100)

      // Store file info in localStorage for persistence
      localStorage.setItem("fileId", fileId) // Use our generated fileId
      localStorage.setItem("fileName", file.name)
      localStorage.setItem("fileRowCount", storedSize.toString())
      localStorage.setItem("fileDataType", "generic") // Default to generic type
      localStorage.setItem("fileUploadDate", new Date().toISOString())
      localStorage.setItem("fileSize", file.size.toString())

      // Store the selected model
      const selectedModel = localStorage.getItem("openai_model") || "gpt-4"
      localStorage.setItem("openai_model", selectedModel)

      // Verify all data is stored correctly
      debugLocalStorage()

      // Double-check that data is actually stored before proceeding
      const finalCheck = localStorage.getItem(`data_${fileId}`)
      if (!finalCheck) {
        throw new Error("Final verification failed. Data was not stored correctly.")
      }

      toast({
        title: "Upload successful",
        description: `${file.name} uploaded with ${storedSize} rows`,
        variant: "success",
      })

      // Wait a moment to ensure localStorage is fully updated
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Navigate to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      })
      setUploadProgress(0)
    } finally {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
      setIsUploading(false)
      setIsLoading(false)
    }
  }

  const apiKey = localStorage.getItem("openai_api_key") || ""

  const handleUpload = () =>
    handleUploadInner(
      file!,
      apiKey,
      toast,
      setActiveTab,
      setIsUploading,
      setUploadProgress,
      setUploadAttempted,
      setIsLoading,
      router,
      parseCSV,
      debugLocalStorage,
    )

  return (
    <div className="flex flex-col space-y-6 overflow-y-auto">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">Upload your data</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Upload a CSV file to get started with AI-powered analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="max-h-[70vh] overflow-y-auto">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="upload" onClick={() => setActiveTab("upload")}>
                Upload
              </TabsTrigger>
              <TabsTrigger value="api-key" onClick={() => setActiveTab("api-key")}>
                API Key & Model
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload">
              <div className="flex flex-col space-y-4">
                {fileError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{fileError}</AlertDescription>
                  </Alert>
                )}

                <div className="text-sm text-muted-foreground mb-2">
                  <p>File requirements:</p>
                  <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>CSV format only</li>
                    <li>Maximum size: {(FILE_SIZE_LIMIT / (1024 * 1024)).toFixed(1)}MB</li>
                    <li>Maximum rows: {MAX_ROWS_LIMIT.toLocaleString()}</li>
                  </ul>
                </div>

                {file ? (
                  <div className="rounded-md border px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileUp className="h-4 w-4 text-gray-500" />
                      <span>{file.name}</span>
                      <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleRemoveFile}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Label
                    htmlFor="upload-file"
                    className="cursor-pointer rounded-md border bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Input
                      id="upload-file"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept=".csv,text/csv,application/vnd.ms-excel"
                    />
                    <FileUp className="h-4 w-4 mr-2" />
                    <span>Click to upload CSV</span>
                  </Label>
                )}
                {uploadAttempted && uploadProgress === 0 && !isUploading && (
                  <p className="text-red-500 text-sm">Upload failed. Please try again.</p>
                )}
                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-center text-muted-foreground">
                      {uploadProgress < 100 ? "Processing your data..." : "Finalizing..."}
                    </p>
                  </div>
                )}
                <Button
                  onClick={handleUpload}
                  disabled={!file || isUploading || !!fileError}
                  className="relative overflow-hidden"
                >
                  {isUploading ? (
                    <span className="flex items-center">
                      <span className="mr-2">Uploading...</span>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    </span>
                  ) : (
                    "Upload"
                  )}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="api-key">
              <ApiKeySettings onKeySaved={() => setApiKeySaved(true)} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

interface ApiKeySettingsProps {
  onKeySaved?: () => void
}

function ApiKeySettings({ onKeySaved }: ApiKeySettingsProps) {
  const [apiKey, setApiKey] = useState(localStorage.getItem("openai_api_key") || "")
  const [model, setModel] = useState(localStorage.getItem("openai_model") || "gpt-4")
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()

  const handleSaveApiKey = async () => {
    setIsSaving(true)
    try {
      storeApiKey(apiKey)
      localStorage.setItem("openai_model", model)
      setShowSuccess(true)

      // Call the callback if provided
      if (onKeySaved) {
        onKeySaved()
      }

      toast({
        title: "Settings Saved",
        description: "Your OpenAI API key and model selection have been saved successfully.",
        variant: "success",
      })

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false)
      }, 3000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="openai-api-key">OpenAI API Key</Label>
          <div className="relative">
            <Input
              id="openai-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className={showSuccess ? "pr-10 border-green-500 focus-visible:ring-green-500" : ""}
            />
            {showSuccess && (
              <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Your API key is stored locally in your browser and is never sent to our servers.
          </p>
        </div>

        <div>
          <Label htmlFor="model-selection">Model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger id="model-selection" className="w-full">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4">GPT-4</SelectItem>
              <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
              <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Select the OpenAI model to use for data analysis. GPT-4 provides the most accurate analysis.
          </p>
        </div>

        <div className="text-sm text-muted-foreground space-y-2">
          <p>
            You can get your API key from the{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              OpenAI dashboard
            </a>
            .
          </p>
          <p>Make sure your API key:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Starts with "sk-"</li>
            <li>Has not expired</li>
            <li>Has sufficient credits</li>
            <li>Has access to the selected model</li>
          </ul>
        </div>

        <Button
          onClick={handleSaveApiKey}
          disabled={isSaving || !apiKey.trim()}
          className={`relative ${showSuccess ? "bg-green-600 hover:bg-green-700" : ""}`}
        >
          {isSaving ? (
            <span className="flex items-center">
              <span className="mr-2">Saving...</span>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            </span>
          ) : showSuccess ? (
            <span className="flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Saved Successfully
            </span>
          ) : (
            "Save Settings"
          )}
        </Button>
      </div>
    </div>
  )
}

