import mongoose from "mongoose";

export const connectDatabase = async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/chat-application');
    } catch (error) {
        return error;
    }
}