# 📄 ChatWithPDF

**ChatWithPDF** is a full-stack AI-powered application that enables users to chat with the contents of any uploaded PDF using **Retrieval-Augmented Generation (RAG)**. It leverages vector search, semantic embeddings, and a large language model (LLM) to generate accurate, context-aware responses from documents.

---

## 🌐 Tech Stack

| Layer        | Technology                          |
|--------------|--------------------------------------|
| Frontend     | Next.js, TailwindCSS, ClerkAuth      |
| Backend      | Node.js, Express, Redis, Qdrant DB   |
| AI Layer     | Google Gemini (via API key) + RAG    |
| Vector Store | Qdrant (for embeddings & retrieval)  |
| Auth         | Clerk                                |
| DevOps       | Docker, Docker Compose               |

---

## 📁 Folder Structure

```
root/
├── client/                # Frontend - Next.js
│   └── .env               # Client-side environment variables
│   └── ...                # Components, pages, hooks, etc.
│
├── server/                # Backend - Express API
│   └── .env               # Server-side environment variables
│   └── ...                # Routes, controllers, workers, etc.
│
├── docker-compose.yml     # Docker services: Redis, Qdrant
```

---

## ⚙️ Environment Variables

### 🔐 Client-side (`client/.env`)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
BASE_URL=http://localhost:3000
```

### 🛠️ Server-side (`server/.env`)
```
PORT=8000
REDIS_HOST=localhost
REDIS_PORT=6379
QDRANT_URL=http://localhost:6333
GEMINI_API_KEY=your_gemini_api_key
CLERK_SECRET_KEY=your_clerk_secret_key
DB_CONNECT=mongodb://localhost:27017/chatwithpdf
```

---

## 🚀 Getting Started

### 📦 Step-by-step Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/ChatWithPDF.git
cd ChatWithPDF

# 2. Start Docker services (Redis + Qdrant)
docker-compose up -d

# 3. Install and run the frontend
cd client
pnpm install
pnpm dev

# 4. Install and run the backend
cd ../server
pnpm install
pnpm dev

# 5. Start the background worker for processing PDFs
pnpm dev:worker
```

---

## 🧠 How It Works

1. **Upload**: User uploads a PDF from the UI.
2. **Process**: PDF is parsed and split into chunks.
3. **Embed & Store**: Chunks are embedded and stored in Qdrant vector DB.
4. **Query**: User question is embedded and matched with relevant chunks.
5. **Respond**: Gemini LLM generates an answer based on matched content.

---

## 📌 Notes

- Make sure Docker is installed and running before starting the services.
- Use `pnpm` instead of `npm` for compatibility with the workspace setup.
- Do not expose API keys or `.env` files in public repositories.

---

## 📄 License

MIT License © 2025 Anvin George
