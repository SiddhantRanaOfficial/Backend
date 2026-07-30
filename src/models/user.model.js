import mongoose from "mongoose"

const userSchema = new mongoose.SchemaType({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  fullname: {
    type: String,
    required: true,
    trim: true,
    index: true,
    index: true
  },
  avatar: {
    type: String, // cloudinary URL
    required: true
  },
  coverImage: {
    type: String,
  },
  watchHistory: [{
    type: Schema.Types.ObjectId,
    ref: "Video"
  }],
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  refreshToken: {
    type: String
  }
}, { timestamps: true })


export const User = mongoose.model("User", userSchema)