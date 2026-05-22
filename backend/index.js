import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { QdrantClient } from "@qdrant/js-client-rest";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
const upload = multer({ dest: uploadDir, limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

const QDRANT_URL = process.env.QDRANT_URL;
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
const COLLECTION_NAME = process.env.COLLECTION_NAME || "RAG-Application";

const qdrantClient = new QdrantClient({
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY,
});

async function getEmbeddings() {
    return new GoogleGenerativeAIEmbeddings({ model: "gemini-embedding-2" });
}

// Helper to retry Qdrant network operations on transient DNS failures (EAI_AGAIN)
async function withRetry(fn, retries = 3, delayMs = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === retries - 1) throw error;
            console.warn(`Network error during Qdrant operation: ${error.message}. Retrying in ${delayMs}ms...`);
            await new Promise(res => setTimeout(res, delayMs));
        }
    }
}



app.post("/upload", upload.single("file"), async (req, res) => {
    let filePath;
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        
        filePath = req.file.path;
        const originalName = req.file.originalname;
        const fileId = req.body.fileId;

        console.log("Loading document:", originalName);
        let docs;
        if (originalName.toLowerCase().endsWith(".pdf")) {
            const loader = new PDFLoader(filePath);
            docs = await loader.load();
        } else if (originalName.toLowerCase().endsWith(".txt") || originalName.toLowerCase().endsWith(".md")) {
            const text = fs.readFileSync(filePath, "utf-8");
            docs = [new Document({ pageContent: text, metadata: { source: filePath } })];
        } else if (originalName.toLowerCase().endsWith(".docx")) {
            const { default: mammoth } = await import("mammoth");
            const result = await mammoth.extractRawText({ path: filePath });
            docs = [new Document({ pageContent: result.value, metadata: { source: filePath } })];
        } else if (originalName.toLowerCase().endsWith(".csv") || originalName.toLowerCase().endsWith(".xlsx")) {
            const { default: xlsx } = await import("xlsx");
            const workbook = xlsx.readFile(filePath);
            let text = "";
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                text += xlsx.utils.sheet_to_csv(sheet) + "\n\n";
            });
            docs = [new Document({ pageContent: text, metadata: { source: filePath } })];
        } else {
            return res.status(400).json({ error: "Unsupported file type. Please upload a PDF, TXT, MD, DOCX, CSV, or XLSX file." });
        }

        // Overwrite source with original name instead of temp upload path
        docs.forEach(doc => { 
            doc.metadata.source = originalName; 
            if (fileId) doc.metadata.fileId = fileId;
        });

        console.log("Document loaded. Chunking...");
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        
        const splitDocs = await textSplitter.splitDocuments(docs);
        if (!splitDocs || splitDocs.length === 0) {
            return res.status(400).json({ error: "No extractable text found in the uploaded document." });
        }
        console.log(`Split into ${splitDocs.length} chunks. Generating embeddings and storing in Qdrant...`);

        const embeddings = await getEmbeddings();

        await withRetry(() => QdrantVectorStore.fromDocuments(splitDocs, embeddings, {
            client: qdrantClient,
            collectionName: COLLECTION_NAME,
        }));

        // Ensure payload indexes exist for fast deletion
        try {
            await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
                field_name: "metadata.fileId",
                field_schema: "keyword",
                wait: true
            });
        } catch(e) {}
        try {
            await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
                field_name: "metadata.source",
                field_schema: "keyword",
                wait: true
            });
        } catch(e) {}

        console.log("Indexing Completed Successfully!");
        res.json({ message: "Document uploaded and indexed successfully!" });
    } catch (err) {
        console.error("INDEXING ERROR:", err);
        const errorMessage = err instanceof Error ? err.message : (typeof err === "string" ? err : JSON.stringify(err));
        res.status(500).json({ error: errorMessage || "An error occurred during indexing." });
    } finally {
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch(e) {
                console.error("Failed to clean up temp file:", e);
            }
        }
    }
});

// Helper for query translation / rewriting
async function rewriteQuery(query, history = []) {
    const llm = new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash",
        temperature: 0.1,
    });
    
    let historyPrompt = "";
    if (history.length > 0) {
        historyPrompt = `\nHere is the feedback from previous retrieval attempts that returned irrelevant data:\n` +
            history.map((h, i) => `Attempt ${i + 1} rewrote query to: "${h.query}". Feedback: ${h.feedback}`).join("\n") +
            `\nPlease rewrite the query focusing on a different aspect, using synonyms, or expanding/simplifying the terms to improve vector search retrieval.`;
    }

    const rewritePrompt = `You are a search query rewriter. Your task is to rewrite the user's input query to maximize its chances of retrieving relevant document chunks from a vector database.
Fix any typos, spelling errors, or grammatical issues in the query.
Add context-rich search synonyms, expand acronyms, or rephrase it to make it more descriptive and suitable for vector search, while preserving the original intent.
Respond ONLY with the rewritten query, and nothing else. Do not wrap in quotes or code blocks.

User Query: "${query}"
${historyPrompt}`;

    const response = await llm.invoke(rewritePrompt);
    return response.content.trim().replace(/^["']|["']$/g, '');
}

// Helper for HyDE (Hypothetical Document Embeddings)
async function generateHydeDocument(query) {
    const llm = new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash",
        temperature: 0.3,
    });

    const hydePrompt = `Given the search query below, write a short, plausible hypothetical document section or answer that would directly answer this query.
Do not worry about absolute factual correctness—simply write a coherent, detailed response that contains the typical vocabulary, terminology, and structure of a document answering this query.
Do not include any introductions, headers, or explanations. Write only the hypothetical document content.

Query: "${query}"`;

    const response = await llm.invoke(hydePrompt);
    return response.content.trim();
}

// Helper for LLM as a Judge
async function evaluateChunks(query, chunks) {
    if (!chunks || chunks.length === 0) return [];
    
    const llm = new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash",
        temperature: 0.1,
    });

    const judgePrompt = `You are a relevance judge. Evaluate if the retrieved document chunks are relevant to answering the user's query.
A chunk is relevant if it contains any information, context, or definitions that help answer the query, even if it doesn't fully answer it. Otherwise, mark it as not relevant.

Query: "${query}"

Chunks to evaluate:
${chunks.map((c, idx) => `[Chunk ${idx}]\nSource: ${c.metadata.source}\nContent: ${c.pageContent}`).join("\n\n")}

For each chunk, evaluate its relevance. You MUST respond with a JSON array of objects, containing "index" (number) and "relevant" (boolean).
Example response format:
[
  {"index": 0, "relevant": true},
  {"index": 1, "relevant": false}
]
Respond ONLY with the JSON array. Do not include markdown code block formatting (like \`\`\`json) or any additional text.`;

    try {
        const response = await llm.invoke(judgePrompt);
        let rawContent = response.content.trim();
        if (rawContent.startsWith("```")) {
            rawContent = rawContent.replace(/^```(json)?/, "").replace(/```$/, "").trim();
        }
        const parsed = JSON.parse(rawContent);
        return parsed;
    } catch (e) {
        console.error("Failed to parse LLM relevance judge response:", e);
        return chunks.map((_, idx) => ({ index: idx, relevant: true }));
    }
}

app.post("/ask", async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: "Query is required" });

        const embeddings = await getEmbeddings();

        let vectorStore;
        try {
            vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
                client: qdrantClient,
                collectionName: COLLECTION_NAME,
            });
        } catch (e) {
            return res.status(400).json({ error: "Failed to connect to collection. Have you indexed a document yet?" });
        }

        console.log("Starting Corrective RAG retrieval pipeline...");
        
        let currentQuery = query;
        let attemptsHistory = [];
        let ragSteps = [];
        let finalChunks = [];
        let retryCount = 0;
        const MAX_RETRIES = 2; // 1 initial attempt + 1 retry

        while (retryCount < MAX_RETRIES) {
            console.log(`[Attempt ${retryCount + 1}] Processing...`);
            
            // 1. Query Translation
            const rewritten = await rewriteQuery(currentQuery, attemptsHistory);
            console.log(`[Attempt ${retryCount + 1}] Rewritten Query:`, rewritten);

            // 2. HyDE Document Generation
            const hydeDoc = await generateHydeDocument(rewritten);
            console.log(`[Attempt ${retryCount + 1}] Generated HyDE Document.`);

            // 3. Retrieval using HyDE Document
            const retriever = vectorStore.asRetriever({ k: 4 });
            const retrieved = await retriever.invoke(hydeDoc);
            
            if (!retrieved || retrieved.length === 0) {
                console.log(`[Attempt ${retryCount + 1}] No chunks found in database.`);
                ragSteps.push({
                    attempt: retryCount + 1,
                    rewrittenQuery: rewritten,
                    hypotheticalAnswer: hydeDoc,
                    judgement: []
                });
                break;
            }

            // 4. LLM Relevance Judge
            const judgements = await evaluateChunks(query, retrieved);
            console.log(`[Attempt ${retryCount + 1}] Relevance Judgements:`, judgements);

            ragSteps.push({
                attempt: retryCount + 1,
                rewrittenQuery: rewritten,
                hypotheticalAnswer: hydeDoc,
                judgement: judgements
            });

            // Filter out irrelevant chunks
            const relevantChunks = retrieved.filter((_, idx) => {
                const judgeObj = judgements.find(j => j.index === idx);
                return judgeObj ? judgeObj.relevant : false;
            });

            console.log(`[Attempt ${retryCount + 1}] Found ${relevantChunks.length} relevant chunks out of ${retrieved.length}.`);

            if (relevantChunks.length >= 2 || (relevantChunks.length >= 1 && retryCount === MAX_RETRIES - 1)) {
                finalChunks = relevantChunks;
                break;
            } else {
                console.log(`[Attempt ${retryCount + 1}] Insufficient relevance. Triggering corrective loop rewrite.`);
                attemptsHistory.push({
                    query: rewritten,
                    feedback: `The search returned only ${relevantChunks.length} relevant chunks. The general topics in the retrieved chunks were: ` + 
                              `${[...new Set(retrieved.map(c => c.pageContent.slice(0, 80)))].join("; ")}. ` +
                              `None of them sufficiently answered the user's specific query intent.`
                });
                
                retryCount++;
                if (retryCount === MAX_RETRIES) {
                    finalChunks = relevantChunks.length > 0 ? relevantChunks : retrieved;
                }
            }
        }

        if (!finalChunks || finalChunks.length === 0) {
            return res.json({ 
                answer: "I cannot answer this based on the provided documents.",
                sources: [],
                ragSteps
            });
        }

        const llm = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            temperature: 0.1
        });

        const systemPrompt = `You are an AI Assistant that helps resolve user queries based ONLY on the provided context.
        
        Rules:
        - Only answer based on the available context below. Do not use outside knowledge.
        - If the answer is not contained in the context, say "I cannot answer this based on the provided documents."
        - Cite the source (e.g., file name) if available in the context metadata.

        Context:
        ${JSON.stringify(finalChunks, null, 2)}
        `;

        const messages = [
            ["system", systemPrompt],
            ["human", query]
        ];

        console.log("Generating grounded final answer...");
        const response = await llm.invoke(messages);
        
        res.json({ 
            answer: response.content, 
            sources: [...new Set(finalChunks.map(c => c.metadata.source))],
            ragSteps
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "An error occurred during answer generation." });
    }
});

app.post("/delete", async (req, res) => {
    try {
        const { fileId, fileName } = req.body;
        if (!fileId && !fileName) return res.status(400).json({ error: "fileId or fileName is required" });

        console.log(`Deleting chunks for document...`);
        
        const matchCondition = { key: "metadata.source", match: { value: fileName } };

        try {
            await withRetry(() => qdrantClient.delete(COLLECTION_NAME, {
                wait: true,
                filter: {
                    must: [matchCondition]
                }
            }));
        } catch (err) {
            if (err.status === 404) {
                console.log("Collection does not exist yet.");
            } else {
                throw err;
            }
        }
        res.json({ message: "Document successfully deleted from Qdrant." });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to delete document.", details: e.message });
    }
});

app.post("/clear", async (req, res) => {
    try {
        console.log("Clearing collection from Qdrant:", COLLECTION_NAME);
        try {
            await qdrantClient.deleteCollection(COLLECTION_NAME);
        } catch (err) {
            if (err.status !== 404) {
                throw err;
            }
            console.log("Collection did not exist, nothing to delete.");
        }
        res.json({ message: "All vectors and documents successfully cleared." });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to clear collection.", details: e.message });
    }
});

app.get("/documents", async (req, res) => {
    try {
        const result = await withRetry(() => qdrantClient.scroll(COLLECTION_NAME, {
            limit: 10000,
            with_payload: true
        }));
        const uniqueSources = [...new Set(result.points.map(p => p.payload?.metadata?.source))].filter(Boolean);
        res.json({ documents: uniqueSources });
    } catch (err) {
        if (err.status === 404) return res.json({ documents: [] });
        console.error(err);
        res.status(500).json({ error: "Failed to fetch documents from Qdrant" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
