import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const auth = asyncHandler(async (req, res, next) => {

    const token = req.cookies.accessToken;

    if (!token) {
        return res.status(401).json(new ApiError(401, "Token not found"));
    }

    const jwtRes = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json(new ApiError(403, "Invalid User"));
        }
        return user;
    });

    const userFind = await User.findById(jwtRes._id);

    if (!userFind) {
        return res.status(404).json(new ApiError(404, "User Not Found"));
    }
    req.user = { _id: jwtRes._id };

    next();
});