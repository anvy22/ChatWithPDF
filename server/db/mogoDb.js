import mongoose from 'mongoose';

async function connectDB() {
  try {
    console.log(process.env.DB_CONNECT);
    await mongoose.connect(process.env.DB_CONNECT);
    console.log('Connected to the database!');
  } catch (err) {
    console.error(err);
  }
}

export default connectDB;
