# AskData AI

## Key Features
- **Natural Language Data Queries**: Ask questions about your data in plain English and get instant insights.
- **Interactive Data Visualization**: Generate responsive charts and graphs based on your queries.
- **Advanced Chart Customization**: Fine-tune visualizations with an intuitive interface for colors and text styling.
- **Multiple Chart Types**: Support for various visualization formats including bar charts, line charts, pie charts, and more.
- **Local Data Processing**: Process and analyze data directly in the browser with no server dependencies.
- **Responsive Design**: Fully responsive interface that works across desktop and mobile devices.
- **Data Persistence**: Save your data and analysis sessions using browser local storage.
- **Client-Side API Integration**: Enter your OpenAI API key directly in the interface with no backend required.

## Technology Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript.
- **UI Components**: Tailwind CSS, shadcn/ui component library.
- **Data Visualization**: Chart.js, React-Chartjs-2.
- **AI Integration**: OpenAI API (client-side) for natural language processing.
- **State Management**: React Context API and hooks.
- **Storage**: Browser Local Storage for data persistence and API key storage.
- **Utilities**: html2canvas for chart export functionality.

## How It Works
1. **Enter API Key**: Input your OpenAI API key in the settings panel.
2. **Upload Data**: Import your CSV files directly in the browser.
3. **Ask Questions**: Type natural language questions about your data.
4. **Get Visualizations**: AI processes your query and generates appropriate visualizations.
5. **Customize & Download**: Fine-tune your charts and download them as images.

## Getting Started
1. Clone the repository.
2. Install dependencies with `npm install`.
3. Run the development server with `npm run dev`.
4. Access the application at `http://localhost:3000`.
5. Enter your OpenAI API key in the application settings.
6. Upload your data and start analyzing!