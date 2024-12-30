import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { auth } from "../middlewares/auth.middleware.js";
import { getAllMessages, getAllUsers, sendMessage } from "../controllers/message.controller.js";

export const messageRouter = Router();

messageRouter.route("/users").get(auth, getAllUsers);
messageRouter.route("/:id").get(auth, getAllMessages);
messageRouter.route("/send/:id").post(auth, upload.single("image"), sendMessage);

