import { v2 as cloudinary } from "cloudinary";
import { response } from "express";
import fs from "fs"

export const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        console.log("File successfully uploaded on cloudinary", response.url);
        return response;
    }
    catch (error) {
        fs.unlinkSync(localFilePath) //remove the temporarily stored file from local server
        return null;
    }
}
