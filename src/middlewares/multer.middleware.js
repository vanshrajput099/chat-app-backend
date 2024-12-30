import multer from "multer";
import path from "path";
import { ___dirname } from "../app.js";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(___dirname, "public"))
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix)
    }
})

export const upload = multer({ storage: storage })