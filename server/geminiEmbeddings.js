import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

export class GeminiEmbeddings {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent?key=${this.apiKey}`;
  }

  async embedQuery(text) {
    try {
      
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/embedding-001',
          content: {
            parts: [{ text }],
          },
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(result));

      console.log("Embedding result:", result.embedding.values);
      return result.embedding.values;
      
    } catch (err) {
      console.error("Error in embedQuery:", err);
      return new Array(768).fill(0); // Default fallback
    }
  }

  async embedDocuments(texts) {
    return Promise.all(texts.map(text => this.embedQuery(text)));
  }
}
