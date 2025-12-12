# MediPattern Tracker

An AI-powered medical journal and pattern tracker that analyzes patient inputs to track pain, sleep, and mood trends over time using Google Gemini.

## Requirements

- Node.js (v18 or higher)
- A Google Gemini API Key

## Setup & Installation

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Setup**
    Create a `.env` file in the root directory and add your API key:
    ```env
    API_KEY=your_google_api_key_here
    ```

3.  **Run Development Server**
    ```bash
    npm run dev
    ```

4.  **Build for Production**
    ```bash
    npm run build
    ```

## Stack
- React + TypeScript
- Vite
- Google GenAI SDK
- Tailwind CSS
- Recharts
- IndexedDB (Client-side storage)
