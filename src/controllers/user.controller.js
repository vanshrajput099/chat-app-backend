import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { deleteImageCloudinary, uploadImageCloudinary } from "../utils/cloudinary.js";
import fs from "fs";
import { generateAccessToken, generateRefreshToken } from "../utils/generateTokens.js";
import Token from "../models/token.model.js";
import { v4 as uuidv4 } from 'uuid';
import { sendMailFunction } from "../utils/nodemailer.js";
import { getSocketId, io } from "../app.js";

export const registerUser = asyncHandler(async (req, res) => {

    const { username, email, password } = req.body;

    if ([username, email, password].some((ele) => ele.trim() === "")) {
        return res.status(400).json(new ApiError(400, "Please Fill All Fields"));
    }

    const user = await User.findOne({ $or: [{ username }, { email }] });

    if (user) {
        return res.status(400).json(new ApiError(400, "User Already Exists With This Username or Email"));
    }

    let filePath = null;
    let url = "https://res.cloudinary.com/dc6yhtvq5/image/upload/v1735454536/zdpsrgu3lbzgsb45iqas.png-default";
    if (req.file) {
        filePath = req.file.path;
        const res = await uploadImageCloudinary(filePath);
        url = res.url + "-" + res.public_id;
        fs.unlinkSync(filePath);
        //url + suffix should be upload for a better image name so in future it can be removed easily
    }

    const newUser = await User.create({
        username,
        email,
        password,
        avatar: url
    });

    if (!newUser) {
        return res.status(400).json(new ApiError(400, "User Registration Failed"));
    }

    const token = await Token.create({
        token: uuidv4(),
        email,
        user: newUser._id,
    });

    await (sendMailFunction(email, token.token));

    return res.status(201).json(new ApiResponse(201, "Verification Mail Sended.Verify Using Link Sended To Your Mail Account.Check Your Spam Folder If Mail Not Found.", { username, email, avatar: url }));
});

export const loginUser = asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if ([username, password].some((ele) => ele.trim() === "")) {
        return res.status(400).json(new ApiError(400, "Please Fill All Fields"));
    }

    const user = await User.findOne({ username });

    if (!user) {
        return res.status(400).json(new ApiError(400, "User Not Found"));
    }

    if (!user.isVerified) {
        return res.status(401).json(new ApiError(401, "User is not verified.Check your mail and spam folder for verification mail."));
    }

    const isValidPassword = await user.isValidPassword(password);

    if (!isValidPassword) {
        return res.status(400).json(new ApiError(400, "Invalid Password"));
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    const refreshSave = await user.save({ validateBeforeSave: false });
    delete refreshSave[password];
    delete refreshSave[refreshToken];

    if (!refreshSave) {
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }

    return res.cookie("accessToken", accessToken, { httpOnly: true }).json(new ApiResponse(200, "User Logged In Successfully", refreshSave));
});

export const logoutUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        return res.status(404).json(new ApiError(404, "User Not Found"));
    }

    user.refreshToken = null;
    
    const userUpdate = await user.save({ validateBeforeSave: false });
    
    io.emit("disconnectUser", req.user._id);
    if (!userUpdate) {
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }

    res.clearCookie("accessToken", { httpOnly: true });
    return res.status(200).json(new ApiResponse(200, "User Logged Out Successfully"));
});

export const verifyToken = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const token = await Token.findOne({ token: id });

    if (!token) {
        return res.status(404).json(new ApiError(404, "Token not found"));
    }

    const user = await User.findOne({ email: token.email });

    if (!user) {
        return res.status(404).json(new ApiError(404, "Invalid Token"));
    }

    if (user.isVerified) {
        return res.status(400).json(new ApiError(400, "User is already verified"));
    }

    user.isVerified = true;
    const userSave = await user.save({ validateBeforeSave: false });

    if (!userSave) {
        return res.status(500).json(new ApiError(500, "Internal server error"));
    }

    await token.deleteOne();

    return res.status(200).json(new ApiResponse(200, "User verified successfully !", {}));
});

export const resendToken = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(400).json(new ApiError(400, "User with this email doesnot exist"));
    }

    if (user.isVerified) {
        return res.status(400).json(new ApiError(400, "User is already verified"));
    }

    const token = await Token.findOne({ email });

    if (token) {
        const removingToken = await token.deleteOne();
        if (!removingToken) {
            return res.status(500).json(new ApiError(500, "Internal server error"));
        }
    }

    const newToken = await Token.create({
        token: uuidv4(),
        email,
        user: user._id,
    });

    const sendMail = await sendMailFunction(email, newToken.token);

    if (!sendMail) {
        return res.status(500).json(new ApiError("Internal server error while sending the mail"));
    }

    return res.status(200).json(new ApiResponse(200, "Mail Sended Successfully !"));
});

export const checkAuth = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select("-password -refreshToken");
    return res.status(200).json(new ApiResponse(200, "User is Authenticated", user));
});

export const changeUserName = asyncHandler(async (req, res) => {
    const { username } = req.body;

    if (username.trim() === "") {
        return res.status(400).json(new ApiError(400, "Please Fill the Username"));
    }

    const user = await User.findOne({ username });

    if (user) {
        return res.status(400).json(new ApiError(400, "Username Already Exists"));
    }

    const currentUser = await User.findById(req.user._id);
    currentUser.username = username;

    const updatingUser = await currentUser.save({ validateBeforeSave: false });

    if (!updatingUser) {
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }

    const userObject = updatingUser.toObject();
    delete userObject['password'];
    delete userObject['refreshToken'];

    return res.status(200).json(new ApiResponse(200, "Username Changed Successfully", userObject));
});

export const changeUserAvatar = asyncHandler(async (req, res) => {
    const currentUser = await User.findById(req.user._id);

    if (!currentUser) {
        return res.status(404).json(new ApiError(404, "User Not Found"));
    }

    let filePath = null;
    let url = null;
    if (req.file) {
        filePath = req.file.path;
        const res = await uploadImageCloudinary(filePath);
        url = res.url + "-" + res.public_id;
        fs.unlinkSync(filePath);
    }

    if (currentUser.avatar.split("-")[1] !== "default") {
        const deleteImage = await deleteImageCloudinary(currentUser.avatar.split("-")[1]);
    }

    currentUser.avatar = url;

    const updatingUser = await currentUser.save({ validateBeforeSave: false });

    if (!updatingUser) {
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }


    const userObject = updatingUser.toObject();
    delete userObject['password'];
    delete userObject['refreshToken'];

    return res.status(200).json(new ApiResponse(200, "Avatar Changed Successfully", userObject));
});

export const changeUserPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if ([oldPassword, newPassword].some((ele) => ele.trim() === "")) {
        return res.status(400).json(new ApiError(400, "Please Fill All Fields"));
    }

    const currentUser = await User.findById(req.user._id);

    if (!currentUser) {
        return res.status(404).json(new ApiError(404, "User Not Found"));
    }

    const isValidPassword = await currentUser.isValidPassword(oldPassword);

    if (!isValidPassword) {
        return res.status(400).json(new ApiError(400, "Invalid Old Password"));
    }

    currentUser.password = newPassword;

    const updatingUser = await currentUser.save({ validateBeforeSave: false });

    if (!updatingUser) {
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }

    return res.status(200).json(new ApiResponse(200, "Password Changed Successfully"));
})