import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { changeUserAvatar, changeUserName, changeUserPassword, checkAuth, loginUser, logoutUser, registerUser, resendToken, verifyToken } from "../controllers/user.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

export const userRouter = Router();

userRouter.route("/register").post(upload.single("avatar"), registerUser);
userRouter.route("/login").post(loginUser);
userRouter.route("/logout").post(auth, logoutUser);
userRouter.route("/token/verify/:id").get(verifyToken);
userRouter.route("/resend-token").post(resendToken);
userRouter.route("/check-auth").get(auth, checkAuth);
userRouter.route("/change-password").patch(auth, changeUserPassword);
userRouter.route("/change-username").patch(auth, changeUserName);
userRouter.route("/change-avatar").patch(auth, upload.single("avatar"), changeUserAvatar);