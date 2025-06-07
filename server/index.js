import { QdrantVectorStore } from '@langchain/qdrant';
import { GeminiEmbeddings } from './geminiEmbeddings.js';
import { config as configDotenv } from 'dotenv'; 
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Queue } from 'bullmq';
import { GeminiChat } from './geminiChatModel.js';
import { authenticateClerkUser } from './middlewares/auth.js'; 
import  connectDB   from './db/mogoDb.js';
import User from './models/userSchema.js';  
import Chat from './models/sessionSchema.js'; 
import nlp from 'compromise';



// Load environment variables
configDotenv();
connectDB(); 
const app = express();
app.use(cors());
app.use(express.json());

const queue = new Queue('file-uploads-queue',{ connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  
  }});



const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, `${uniqueSuffix}-${file.originalname}`)
  }
})


function generateTitleFromText(text) {
  const doc = nlp(text);
  const nouns = doc.nouns().out('array');
  const keywords = [...new Set(nouns.map(n => n.toLowerCase()))].slice(0, 4);
  const title = keywords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(', ');
  return title || 'Untitled Chat';
}



const upload = multer({ storage: storage })



// Root route
app.get('/', authenticateClerkUser ,(req, res) => {
  res.send('Hello, World!');
});


// Upload route
app.post('/upload/pdf', authenticateClerkUser, upload.single('pdf'), async (req, res) => {
  try {
    const { originalname, destination, path } = req.file;
    const userId = req.user.id;

   

    // Step 1: Find existing user or create a new one
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({ userId, pdfs: [] }); // start with empty pdfs list
    }

    // Step 2: Add the PDF info
    user.pdfs.push({
      pdfName: originalname,
      pdfPath: path, // full file path (e.g., 'uploads/file.pdf')
    });

    // Step 3: Save user
    await user.save();

    // Step 4: Add job to queue
    await queue.add('file-ready', JSON.stringify({
      filename: originalname,
      destination,
      path,
      id: userId,
    }));

    res.status(200).json({ message: 'PDF uploaded and user data updated successfully.' });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Error uploading PDF or saving user data.' });
  }
});


app.get('/chat', authenticateClerkUser, async(req, res) => {
     
      const userQuery = req.query.message;
      console.log("User Query:", userQuery);

      try{
            const chatRec = new Chat({
               userId: req.user.id,
               messages: [
                  {
                      role: 'user',
                      content: userQuery,
                      metadata: '', // optional
                  },
                 ],
             });
          
      await chatRec.save();

     


      if (!userQuery || typeof userQuery !== 'string' || userQuery.trim() === '') {
        return res.status(400).json({ error: 'Input something...' });
      }

      const embeddings = new GeminiEmbeddings();

      const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
        url: process.env.QDRANT_URL,
        collectionName: req.user.id || "pdf-docs",
      });


      const retriever = vectorStore.asRetriever({
              k: 2,    
            });

    const result =  await retriever.invoke(userQuery);

    const SYSTEM_PROMPT = `You are a helpful assistant. Answer the user's question based on the provided context from a PDF file.
    Context:${JSON.stringify(result)}`;

    const chat = new GeminiChat();

    chat.askQuestion({ result,userQuery }).then(answer => {

        
      const chatRec = new Chat({
                    userId: req.user.id,
                    messages: [
                      {
                           role: 'bot',
                           content: answer,
                           metadata: result,
                       },
                      ],
                   });

         chatRec.save();
        
        res.status(200).json({
          answer: answer,
          context: result,
        });
    });
 } catch (error) {
        console.error("Error in /chat route:", error);
        return res.status(500).json({ error: 'Internal server error' }); 
  } 

});

app.get('/chat/history',authenticateClerkUser ,async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) return res.status(400).json({ message: 'Missing user ID' });

    const chatHistory = await Chat.find({ userId }).sort({ createdAt: 1 });

    if (!chatHistory || chatHistory.length === 0) {
      return res.status(404).json([]);
    }

    // Group chats by 1-hour intervals
    const groupedChats = [];
    let group = [];
    let lastTime = null;

    for (const chat of chatHistory) {
      const time = new Date(chat.createdAt);
      if (!lastTime || (time - lastTime) / (1000 * 60 * 60) < 1) {
        group.push(chat);
      } else {
        groupedChats.push(group);
        group = [chat];
      }
      lastTime = time;
    }
    if (group.length > 0) groupedChats.push(group);

    // Add title generation
    const titledGroups = groupedChats.map(group => {
      const allMessages = group.flatMap(chat => chat.messages || []);
      const combinedText = allMessages.map(m => m.content).join(' ');
      const title = generateTitleFromText(combinedText);
      return {
        title,
        chats: group.map(chat => ({
          chatId: chat._id,
          createdAt: chat.createdAt,
          messages: chat.messages
        }))
      };
    });

   ;



    res.status(200).json(titledGroups);


  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



app.get('/uploaded/pdfs' ,authenticateClerkUser ,async (req, res) => {
  try {
    const userId = req.user.id; 
    if (!userId) return res.status(400).json({ message: 'Missing user ID' });

    const user = await User.findOne({ userId });
    if (!user || !user.pdfs || user.pdfs.length === 0) {
      return res.status(404).json({ message: 'No Uploads found for this user.' });
    }

    res.status(200).json(user.pdfs);
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/delete/pdf', authenticateClerkUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const pdfPath = req.query.pdfPath;

    if (!pdfPath || typeof pdfPath !== 'string') {
      return res.status(400).json({ message: 'Missing or invalid pdfPath' });
    }

    const embeddings = new GeminiEmbeddings();
    const collectionName = String(userId || "pdf-docs");

    const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
      url: process.env.QDRANT_URL,
      collectionName,
    });

    const client = vectorStore.client;
    const sourcePathToDelete = pdfPath.replace(/\\/g, '/');

    console.log("Deleting vectors with source:", sourcePathToDelete);

    // Correct delete operation
    const deleteResult = await client.delete(collectionName, {
      wait: true,
      filter: {
        must: [
          {
            key: "source",
            match: {
              value: sourcePathToDelete,
            },
          },
        ],
      },
    });

    // MongoDB update
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $pull: { pdfs: { pdfPath } } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "PDF deleted successfully",
      result: deleteResult,
    });

  } catch (error) {
    console.error('Error deleting PDF:', error);
    res.status(500).json({ 
      message: 'Failed to delete PDF',
      error: error.message,
      details: error.response?.data // Include API error details
    });
  }
});


// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
