// Utility functions for API key management

// Get the API key from localStorage
export function getApiKey(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("openai_api_key")
}

// Set the API key in localStorage
export function setApiKey(apiKey: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem("openai_api_key", apiKey)
}

// Check if the API key is set
export function hasApiKey(): boolean {
  if (typeof window === "undefined") return false
  return !!localStorage.getItem("openai_api_key")
}

// Clear the API key from localStorage
export function clearApiKey(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("openai_api_key")
}

/**
 * Validate API key format
 */
export function validateApiKey(apiKey: string): { valid: boolean; error?: string } {
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

  return { valid: true }
}

/**
 * Test if the API key is valid by making a request to the test endpoint
 */
export async function testApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    // Validate format first
    const formatValidation = validateApiKey(apiKey)
    if (!formatValidation.valid) {
      return formatValidation
    }

    // Call the test endpoint
    const response = await fetch("/api/test-api-key", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ apiKey: apiKey.trim() }),
    })

    const data = await response.json()

    if (!response.ok || !data.valid) {
      return {
        valid: false,
        error: data.error || "API key was rejected by OpenAI",
      }
    }

    return { valid: true }
  } catch (error) {
    console.error("Error testing API key:", error)
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Failed to test API key",
    }
  }
}

/**
 * Store API Key in local storage
 */
export function storeApiKey(apiKey: string): void {
  if (typeof window === "undefined") return
  localStorage.setItem("openai_api_key", apiKey)
}

