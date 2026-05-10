# NotebookLM Clone (Fullstack RAG Pipeline)

This is a complete RAG-powered application built as a clone of Google NotebookLM. It allows users to upload documents (PDF or text files) and converse with them via a beautiful web interface.

## Project Structure

- **`backend/`**: Node.js Express server that handles the LangChain RAG pipeline.
- **`frontend/`**: Vanilla HTML/CSS/JS frontend application with a modern glassmorphism design.

## Features Implemented

- **Ingestion**: Supports reading from `.pdf` and `.txt` files.
- **Chunking**: Uses LangChain's `RecursiveCharacterTextSplitter`.
- **Embedding**: Generates embeddings using Google's `gemini-embedding-2`.
- **Storage**: Indexes and stores chunks and embeddings in **Qdrant** (Vector Database).
- **Retrieval**: Uses cosine similarity retrieval via Qdrant to find the most relevant chunks.
- **Generation**: Uses Google's `gemini-2.5-flash` with a strict system prompt to ensure answers are completely grounded in the retrieved document context.
- **Management**: Allows deleting specific uploaded documents from the vector database.

## Setup & Running

1. **Setup Qdrant Cloud Cluster**
   - Go to [Qdrant Cloud](https://cloud.qdrant.io/) and create a free cluster.
   - Copy the **Cluster URL** and **API Key** from your dashboard.

2. **Configure Environment Variables**
   Inside the `backend/` directory, update your `.env` file with your API keys:
   ```env
   OPENAI_API_KEY=sk-your-openai-api-key # Optional if using Gemini
   GOOGLE_API_KEY=your-google-api-key
   QDRANT_URL=https://your-cluster-id.cloud.qdrant.io:6333
   QDRANT_API_KEY=your-qdrant-api-key
   COLLECTION_NAME=NotebookLM_Clone
   ```

3. **Start the Backend**
   ```bash
   cd backend
   npm install
   npm start
   ```

4. **Start the Frontend**
   Simply open `frontend/index.html` in your web browser, or use a tool like Live Server. You will be greeted with the web application!

## Usage

1. Use the **Upload a Document** section to upload your knowledge base.
2. Once indexed, type your question in the **Ask a Question** section.
3. If you no longer need a document's context, type its filename into the **Manage Documents** section and hit delete.
