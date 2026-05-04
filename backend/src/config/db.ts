import mongoose from "mongoose";

export async function connectDatabase(uri: string) {
  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }

  await mongoose.connect(uri);
}
