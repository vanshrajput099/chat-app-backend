import { v2 as cloudinary } from 'cloudinary';

export const uploadImageCloudinary = async (filePath) => {

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_USERNAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API
    });

    try {
        const upload = await cloudinary.uploader.upload(filePath);
        return upload;
    } catch (error) {
        return error;
    }

}

export const deleteImageCloudinary = async (publicId) => {

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_USERNAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API
    });

    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        return error;
    }

}