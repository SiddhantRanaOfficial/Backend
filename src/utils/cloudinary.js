import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
import { ApiError } from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null
    // upload the file on Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    })
  } catch (error) {
    fs.unlinkSync(localFilePath) // Remove the locally saved temporary file as the upload got failed

    // return null (Causes a 400 error even though it is a 500 error)

    throw new ApiError(
      500,
      "Failed to upload the image to Cloudinary\nPlease Reupload",
      [],
      error.stack //Ensures the exact cause of error reaches the error middleware
    )
    // throw error (Again ensures instead of a custom message the exact error message reaches the error middleware)
  }
  // file has been uploaded successfully (These 3 LOC are outside "try" to ensure "catch" executes only for cloudinary fails)
  console.log("File is uploaded on Cloudinary ", response.url)
  fs.unlinkSync(localFilePath)
  return response

  /* Using Finally block here, catch isn't used instead the exception is allowed to travell up to the error middleware"
  const uploadOnCloudinary = async (localFilePath) => {
    if (!localFilePath) return null;

    try {
        return await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
    }
    finally {
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
    }
}*/
}


export { uploadOnCloudinary }



