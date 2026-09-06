import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
import { ApiError } from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const removeLocalFile = async (localFilePath) => {
  if (localFilePath && fs.existsSync(localFilePath)) {
    try {
      await fs.promises.unlink(localFilePath);
    } catch (error) {
      console.error(`Failed to clean up temp file ${localFilePath}:`, error);
    }
  }
};

const uploadOnCloudinary = async (localFilePath) => {
  if (!localFilePath) return null;

  try {
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    });

    await removeLocalFile(localFilePath);
    return response;
  } catch (error) {
    await removeLocalFile(localFilePath);
    throw new ApiError(
      500,
      "Failed to upload file to Cloudinary. Please try again.",
      [],
      error.stack
    );
  }
};

export { uploadOnCloudinary };






