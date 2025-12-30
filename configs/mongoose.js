import mongoose from "mongoose";

const connectDb = async () => {
  try {
    mongoose.connection.on("connected", () =>
      console.log("Database connected")
    );
    await mongoose.connect(process.env.MONGODB_URL, {
      dbName: "split-application",
    });

    mongoose.connection.on("error", (err) =>
      console.error("MongoDB connection error:", err.message)
    );
    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected");
    });
  } catch (error) {
    console.error("Failed to connect to the database:", error.message);
    process.exit(1);
  }
};

export default connectDb;
