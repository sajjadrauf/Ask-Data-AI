import { Upload } from "@/components/upload"

export default function Home() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="border-b bg-white dark:bg-gray-950 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
            AskData AI
          </h1>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 py-4 min-h-min">
          <div className="flex flex-col justify-center space-y-6">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-4">Chat with your data</h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Upload your data and instantly get AI-powered visualizations and insights. Ask questions in natural
                language and see your data come to life.
              </p>
            </div>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-200">Instant data visualization</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-200">Natural language queries</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-gray-700 dark:text-gray-200">AI-powered insights</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col space-y-6">
            <Upload />
          </div>
        </div>
      </main>
    </div>
  )
}

