import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
  }
  catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens")
  }
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken }

}


const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password & refresh token field from response
  // check for user creation 
  // return response

  if (!req.body || typeof req.body !== "object") {
    throw new ApiError(400, "Request body is required");
  }
  const { fullname, email, username, password } = req.body
  console.log("fullname:", fullname)
  if (
    typeof fullname !== "string" ||
    typeof email !== "string" ||
    typeof username !== "string" ||
    typeof password !== "string"
  ) {
    throw new ApiError(400, "Invalid field type");
  }

  // Empty/whitespace validation
  if (
    !fullname.trim() ||
    !email.trim() ||
    !username.trim() ||
    !password.trim()
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists")
  }
  console.log(req.files)

  const avatarLocalPath = req.files?.avatar?.[0]?.path
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  // if (!avatar) {
  //   throw new ApiError(500, "Something went wrong while uploading the avatar\nPlease try again")
  // }  // Redundant, since cloudinary utlity handles upload rejections. Loses the original error. It is never really reached unless my catch(error) in cloudinary utility returns null

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user")
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered succesfully")
  )

})

// const bloginUser = asyncHandler(async (req,res) => {
//   // Get data from req body
//   // username/email
//   // find the user
//   // password check 
//   // access & refresh token generation  
//   // send cookies & success response

//   const {email, userName, password} = req.body

//   if(!userName && !email){
//     throw new ApiError(400, "Username or Email is required")
//   }
//   if(!password){
//     throw new ApiError(400, "Password required")
//   }

//   const user = await User.findOne({
//     $or: [{username}, {email}]
//   })

//   if(!user){
//     throw new ApiError(404, "User does not exist")
//   }

//   const isPasswordValid = await user.isPasswordCorrect(password)

//   if(!isPasswordValid){
//     throw new ApiError(401, "Incorrect Password")
//   }

//   const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

//   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

//   const options = {
//     httpOnly,
//     secure
//   }

//   return res
//   .status(200)
//   .cookie("accessToken", accessToken, options)
//   .cookie("refreshToken", refreshToken, options)
//   .json(
//     new ApiResponse(200),
//     {
//       user: loggedInUser, accessToken, refreshToken
//     },
//     "User logged in successfully"
//   )
// })



const loginUser = asyncHandler(async (req, res) => {

  // Get data from request body
  // Validate input
  // Find user
  // Check password
  // Generate tokens
  // Save refresh token in database
  // Fetch user without sensitive fields
  // Cookie options
  // Send response

  const { email, username, password } = req.body;

  if ((!email && !username) || !password) {
    throw new ApiError(
      400,
      "Username or email and password are required"
    );
  }

  const user = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect Password");
  }

  const accessToken = user.generateAccessToken();

  const refreshToken = user.generateRefreshToken();


  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: ""
      }
    },
    {
      new: true
    }
  );

  const options = {
    httpOnly: true,
    secure: true
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(
        200,
        {},
        "User logged out successfully"
      )
    );

});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorised request")
  }
  try { //jwt.verify() throws an unhandled exception at failure so wrap it in a try catch block
    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
  }
  catch (error) {
    throw new ApiError(401, "Unauthorised request", [], error)
  }
  const user = await User.findById(decodedRefreshToken?._id)

  if (!user) {
    throw new ApiError(401, "Invalid refresh token")
  }

  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "Session timed out (Refresh token expired or used")
  }

  const options = {
    httpOnly: true,
    secure: true
  }

  const accessToken = user.generateAccessToken()
  const newRefreshToken = user.generateRefreshToken()

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(
      new ApiResponse(
        200, { accessToken, refreshToken: newRefreshToken }, "Access token refreshed"
      )
    )

})

// const changeCurrentPassword = asyncHandler(async (req, res) => {

//   const { oldPassword, newPassword } = req.body
//   const user = await User.findById(req.user?._id)
//   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

//   if (!isPasswordCorrect) {
//     throw new ApiError(400, "Invalid password")
//   }
//   user.password = newPassword
//   await user.save({ validateBeforeSave: false })

//   return res
//     .status(200)
//     .json(new ApiResponse(200, {}, "Password changed successfully"))
// })

const getCurrentUser = asyncHandler(async (req, res) => {

  return res.status(200).json(

    new ApiResponse(
      200,
      req.user,
      "Current user fetched successfully"
    )

  );

});


const changeCurrentPassword = asyncHandler(async (req, res) => {

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(
      400,
      "Old password and new password are required"
    );
  }

  const user = await User.findById(req.user._id);

  const isPasswordCorrect =
    await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(
      400,
      "Old password is incorrect"
    );
  }

  user.password = newPassword;

  await user.save({
    validateBeforeSave: false
  });

  return res.status(200).json(

    new ApiResponse(
      200,
      {},
      "Password changed successfully"
    )

  );

});

const updateProfile = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullname,
        email
      }
    },
    {
      new: true,
      runValidators: true
    }
  ).select("-password -refreshToken");

  res.status(200).json(
    new ApiResponse(
      200,
      user,
      "Profile updated successfully"
    )
  );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File Missing!")
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar) {
    throw new ApiError(400, "Error while uploading avatar")
  }

  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    {
      new: true,
      runValidators: true
    }
  ).select("-password -refreshToken")
  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover Image File Missing!")
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if (!coverImage) {
    throw new ApiError(400, "Error while uploading cover image")
  }

  const user = await User.findByIdAndUpdate(req.user?._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    {
      new: true,
      runValidators: true
    }
  ).select("-password -refreshToken")
  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "Cover image updated successfully")
    )
})



const deleteAccount = asyncHandler(async (req, res) => {

  await User.findByIdAndDelete(req.user._id);

  res.status(200).json(
    new ApiResponse(
      200,
      {},
      "Account deleted successfully"
    )
  );
});


export {
  updateUserCoverImage,
  updateUserAvatar,
  refreshAccessToken,
  // bloginUser,
  deleteAccount,
  updateProfile,
  changeCurrentPassword,
  logoutUser,
  getCurrentUser,
  loginUser,
  registerUser
} 