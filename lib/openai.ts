export const testApiKey = async (apiKey: string): Promise<{ valid: boolean; error?: string }> => {
  try {
    // First, check if the API key has the correct format
    if (!apiKey || !apiKey.trim()) {
      return { valid: false, error: "API key cannot be empty" }
    }

    const trimmedKey = apiKey.trim()

    if (!trimmedKey.startsWith("sk-")) {
      return { valid: false, error: "API key must start with 'sk-'" }
    }

    if (trimmedKey.length < 20) {
      return { valid: false, error: "API key is too short" }
    }

    // If format is valid, test with the API
    console.log("Testing API key with OpenAI...")

    const response = await fetch("/api/test-api-key", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ apiKey: trimmedKey }),
    })

    const data = await response.json()

    if (!response.ok || !data.valid) {
      console.error("API key test failed:", data)
      return {
        valid: false,
        error: data.error || "API key was rejected by OpenAI",
      }
    }

    console.log("API key test successful")
    return { valid: true }
  } catch (error) {
    console.error("Error testing API key:", error)
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Failed to test API key",
    }
  }
}

