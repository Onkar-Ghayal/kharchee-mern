const mongoose = require("mongoose");

const defaultMongoUri = "mongodb://127.0.0.1:27017/kharcheDB";

const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI || defaultMongoUri;

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000
        });
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        console.error(`Using Mongo URI: ${mongoUri}`);
        console.error("Update server/.env MONGO_URI to a valid MongoDB connection string or start MongoDB locally.");
    }
};

module.exports = connectDB;
