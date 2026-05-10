# RAG: Knowledge Retrieval Platform

A secure, AI-powered document intelligence platform built on a modern RAG (Retrieval-Augmented Generation) pipeline. This application allows users to seamlessly upload complex documents and instantly retrieve precise, fully-cited answers from their personal knowledge base.

## Project Architecture

- **`backend/`**: Node.js Express API. Orchestrates the LangChain pipeline, chunking, and embedding generation.
- **`frontend/`**: React application using Vite, styled with Tailwind CSS and Shadcn UI. Features a professional split-pane resizable layout and real-time state persistence.

## Core Features

- **Multi-Format Ingestion**: Natively processes `.pdf`, `.txt`, `.md`, `.docx`, `.csv`, and `.xlsx` files.
- **Dynamic Chunking**: Leverages LangChain's `RecursiveCharacterTextSplitter` for semantic document chunking.
- **Google GenAI Embeddings**: Converts text chunks into dense vectors using `gemini-embedding-2`.
- **Qdrant Vector Store**: Ensures ultra-fast cosine similarity retrieval and strictly synchronized state management for robust file deletion.
- **Grounded Responses**: AI responses are powered by `gemini-2.5-flash` with strict grounding logic to prevent hallucinations, supporting full Markdown rendering.
- **Resilient Infrastructure**: Built-in network retry layers for maximum stability against flaky connections and DNS drops.

## Setup & Local Development

### 1. Vector Database Setup
- Create a free cluster on [Qdrant Cloud](https://cloud.qdrant.io/).
- Retrieve your **Cluster URL** and **API Key**.

### 2. Environment Variables
Inside the `backend/` directory, configure your `.env` file:
```env
GOOGLE_API_KEY=your-google-gemini-api-key
QDRANT_URL=https://your-cluster-id.cloud.qdrant.io:6333
QDRANT_API_KEY=your-qdrant-api-key
COLLECTION_NAME=RAG-Application
```

### 3. Run the Application
Start the unified full-stack application from the project root:
```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install
npm run build

# Start the local development server
cd ..
npm run dev
```

The server will automatically serve the frontend build and expose the backend API on `http://localhost:3000`.
