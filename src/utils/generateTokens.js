import jwt from "jsonwebtoken";

export const generateAccessToken = (user) => {
    return jwt.sign({ _id: user._id, username: user.username, email: user.email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
}

export const generateRefreshToken = (user) => {
    return jwt.sign({ _id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
}