import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected: ' + conn.connection.host);

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error: ' + err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ DB Connection Error: ' + error.message);
    process.exit(1);
  }
};

export default connectDB;
