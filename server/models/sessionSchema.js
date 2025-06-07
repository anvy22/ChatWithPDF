import { metadata } from 'framer-motion/client';
import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
  userId: {
    type: String, // Optional: if you have a users collection
    required: true
  },
  messages: [
    {
      role: {
        type: String,
        enum: ['user', 'bot'],
        required: true
      },
      content: {
        type: String,
        required: true
      },
      metadata: {
        type: mongoose.Schema.Types.Mixed ,
        default: '',
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Chat = mongoose.model('Chat', ChatMessageSchema);
export default Chat;
