import { type NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api-key-utils"

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()
    const { apiKey } = body

    if (!apiKey) {
      return NextResponse.json({ valid: false, error: "No API key provided" }, { status: 400 })
    }

    // Validate API key format
    const keyValidation = validateApiKey(apiKey)
    if (!keyValidation.valid) {
      return NextResponse.json({ valid: false, error: keyValidation.error }, { status: 400 })
    }

    // Test the API key with a simple request to OpenAI's models endpoint
    try {
      console.log("Testing API key validity...")

      // Use the models endpoint which is lightweight and doesn't consume tokens
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("API key test failed:", errorData)

        // Extract the error message
        const errorMessage = errorData.error?.message || "Unknown error from OpenAI"

        return NextResponse.json(
          {
            valid: false,
            error: `OpenAI rejected the API key: ${errorMessage}`,
            details: errorData,
          },
          { status: 401 },
        )
      }

      console.log("API key test successful")
      return NextResponse.json({ valid: true, message: "API key is valid" })
    } catch (error) {
      console.error("API key test failed:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"

      return NextResponse.json(
        {
          valid: false,
          error: "Failed to validate API key with OpenAI",
          details: errorMessage,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error testing API key:", error)
    return NextResponse.json(
      {
        valid: false,
        error: "Failed to test API key",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

