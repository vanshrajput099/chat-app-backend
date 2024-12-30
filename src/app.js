import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Server } from 'socket.io';
import http from 'http';

export const app = express();
export const ___dirname = path.resolve();

//Middlewares
app.use(cors({
    origin: ['http://localhost:5173', 'https://vanshrajput099.github.io/chat-app-frontend/'],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(___dirname, 'public')));


//Socket-io
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'https://vanshrajput099.github.io/chat-app-frontend/'],
        credentials: true,
    },
});

const userSocket = {};

export const getSocketId = (userId) => {
    return userSocket[userId];
};

io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
        userSocket[userId] = socket.id;
    }
    io.emit('onlineUsers', Object.keys(userSocket));
    socket.on('disconnect', () => {
        delete userSocket[userId];
        io.emit('onlineUsers', Object.keys(userSocket));
    });
});

export { io, server };

//Routes
import { userRouter } from "./routes/user.routes.js";
import { messageRouter } from "./routes/message.routes.js";
app.use("/api/v1/users", userRouter);
app.use("/api/v1/messages", messageRouter);
