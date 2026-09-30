import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGO_URI is not set. Check your .env file (see .env.example).");
    process.exit(1);
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    console.error(
      "Make sure MongoDB is running and MONGO_URI in your .env file is correct."
    );
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected.");
  });
}

export default connectDB;
