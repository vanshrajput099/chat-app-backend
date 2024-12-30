import { getSocketId, io } from "../app.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadImageCloudinary } from "../utils/cloudinary.js";

export const getAllUsers = asyncHandler(async (req, res) => {
    const allUsers = await User.find({ _id: { $ne: req.user._id } }).select("-password -refreshToken");
    return res.status(200).json(new ApiResponse(200, "All Users", allUsers));
});

export const getAllMessages = asyncHandler(async (req, res) => {
    const messageBoxUserId = req.params.id;

    const allMessages = await Message.find({
        $or: [
            { senderId: req.user._id, recieverId: messageBoxUserId },
            { senderId: messageBoxUserId, recieverId: req.user._id }
        ]
    });

    return res.status(200).json(new ApiResponse(200, "All Messages", allMessages));
});

export const sendMessage = asyncHandler(async (req, res) => {

    const { text } = req.body;

    const messageBoxUserId = req.params.id;
    const senderMessageUserId = req.user._id;

    if (text.length === 0 && !req.file) {
        return res.status(400).json(new ApiResponse(400, "Text or Image is required"));
    }

    let filePath = null;
    let url = null;

    if (req.file) {
        filePath = req.file.path;
        const res = await uploadImageCloudinary(filePath);
        url = res.url + "-" + res.public_id;
    }

    const message = await Message.create({
        message: text,
        image: url,
        senderId: senderMessageUserId,
        recieverId: messageBoxUserId
    });

    if (!message) {
        return res.status(500).json(new ApiError(500, "Message not sent"));
    }

    const recieverSocketId = getSocketId(messageBoxUserId);
    if (recieverSocketId) {
        io.to(recieverSocketId).emit("newMessage", message);
    }

    return res.status(200).json(new ApiResponse(200, "Message sent", message));
});