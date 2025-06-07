import { Worker } from 'bullmq';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { QdrantVectorStore } from '@langchain/qdrant';
import { config as configDotenv } from 'dotenv';
import { GeminiEmbeddings } from './geminiEmbeddings.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

configDotenv();

// To resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Worker started");

const worker = new Worker(
  'file-uploads-queue',
  async job => {
    try {
      const data = typeof job.data === 'string' ? JSON.parse(job.data) : job.data;
      console.log("Received job:", data);

      if (typeof data.path !== 'string' || data.path.trim() === '') {
        console.error("Invalid or empty 'path' in job data.");
        return;
      }

      const absolutePath = path.resolve(__dirname, path.normalize(data.path));
      console.log("Resolved file path:", absolutePath);

      if (!fs.existsSync(absolutePath)) {
        console.error("File does not exist at:", absolutePath);
        return;
      }

      const loader = new PDFLoader(absolutePath);
      const docs = await loader.load();



      const embeddings = new GeminiEmbeddings();

      const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: process.env.QDRANT_URL,
        collectionName: data.id || "pdf-docs",
      });

      await vectorStore.addDocuments(docs);
      console.log(" Documents added to Qdrant vector store");

    } catch (err) {
      console.error("Error in worker:", err);
    }
  },
  {
    concurrency: 1,
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    },
  }
);
