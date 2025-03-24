/**
 * Utility functions for managing localStorage
 */

/**
 * Store data in localStorage with retry mechanism
 * @param key The key to store the data under
 * @param data The data to store
 * @param maxAttempts Maximum number of retry attempts
 * @returns Success status and stored data size
 */
export async function storeWithRetry(
  key: string,
  data: any,
  maxAttempts = 3,
): Promise<{ success: boolean; storedSize: number }> {
  let currentData = data
  let success = false
  let attempt = 0
  let storedSize = 0

  while (!success && attempt < maxAttempts) {
    attempt++
    try {
      const dataString = JSON.stringify(currentData)
      storedSize = currentData.length

      // Store the data
      localStorage.setItem(key, dataString)

      // Verify storage
      const verification = localStorage.getItem(key)
      if (verification) {
        success = true
        console.log(`Successfully stored ${storedSize} items with key: ${key} (attempt ${attempt})`)
      } else {
        console.warn(`Storage verification failed for key: ${key} (attempt ${attempt})`)
        // Reduce data size for next attempt
        currentData = currentData.slice(0, Math.floor(currentData.length * 0.7))
      }
    } catch (error) {
      console.error(`Error storing data for key: ${key} (attempt ${attempt})`, error)
      // Reduce data size for next attempt
      currentData = currentData.slice(0, Math.floor(currentData.length * 0.7))
    }

    // Wait a bit before next attempt
    if (!success && attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  return { success, storedSize }
}

/**
 * Load data from localStorage with retry mechanism
 * @param keys Array of possible keys to try
 * @param maxAttempts Maximum number of retry attempts
 * @returns The loaded data or null if not found
 */
export async function loadWithRetry(keys: string[], maxAttempts = 3): Promise<any | null> {
  let attempt = 0
  let loadedData = null

  while (!loadedData && attempt < maxAttempts) {
    attempt++

    for (const key of keys) {
      try {
        const storedData = localStorage.getItem(key)
        if (storedData) {
          const parsedData = JSON.parse(storedData)
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            console.log(`Successfully loaded data from key: ${key} (attempt ${attempt})`)
            loadedData = parsedData
            break
          }
        }
      } catch (error) {
        console.error(`Error loading data for key: ${key} (attempt ${attempt})`, error)
      }
    }

    // Wait a bit before next attempt
    if (!loadedData && attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }

  return loadedData
}

/**
 * Clear all data for a specific file ID
 * @param fileId The file ID to clear data for
 */
export function clearFileData(fileId: string): void {
  try {
    localStorage.removeItem(`data_${fileId}`)
    localStorage.removeItem(fileId)
    console.log(`Cleared data for file ID: ${fileId}`)
  } catch (error) {
    console.error(`Error clearing data for file ID: ${fileId}`, error)
  }
}

