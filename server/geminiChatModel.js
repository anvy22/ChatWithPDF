import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();
import Chat from './models/sessionSchema.js'; 

export class GeminiChat {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
  }

  async askQuestion({ result, userQuery }) {
    const fullUserQuery = `
      You are a helpful assistant. Answer the user's question based on the provided context from a PDF file.

      Context: ${JSON.stringify(result)}

      User's Question: ${userQuery}
    `;

    const requestBody = {
      contents: [
        {
          role: 'user', // All parts of the prompt, including context, go under the 'user' role
          parts: [{ text: fullUserQuery }],
        },
      ],
      // You can also add safety settings and generation config here if needed
      // safetySettings: [
      //   {
      //     category: 'HARM_CATEGORY_HARASSMENT',
      //     threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      //   },
      // ],
      // generationConfig: {
      //   temperature: 0.7,
      //   topP: 0.95,
      //   topK: 40,
      //   maxOutputTokens: 1024,
      // },
    };

    console.log("Request Body:", JSON.stringify(requestBody, null, 2));
    
    try {
      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();
      console.log("Gemini API Response:", data);

      if (!res.ok) throw new Error(JSON.stringify(data));

      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.';

      console.log("Gemini Response:", responseText);
      return responseText;
    } catch (err) {
      console.error("Error in askQuestion:", err);
      return "Sorry, I couldn't process the request.";
    }
  }
}
