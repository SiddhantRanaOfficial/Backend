/*
 ============================================================================
 [PHASE 1 FEATURE]: Like Controller Implementation
 ============================================================================
 Handles polymorphic liking functionality for videos, comments, and tweets.
*/

import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// [PHASE 1 FEATURE]: Toggle like on a video
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id
  });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    return res
      .status(200)
      .json(new ApiResponse(200, { isLiked: false }, "Unliked video successfully"));
  } else {
    const newLike = await Like.create({
      video: videoId,
      likedBy: req.user._id
    });
    return res
      .status(201)
      .json(new ApiResponse(201, { isLiked: true, like: newLike }, "Liked video successfully"));
  }
});

// [PHASE 1 FEATURE]: Toggle like on a comment
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id
  });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    return res
      .status(200)
      .json(new ApiResponse(200, { isLiked: false }, "Unliked comment successfully"));
  } else {
    const newLike = await Like.create({
      comment: commentId,
      likedBy: req.user._id
    });
    return res
      .status(201)
      .json(new ApiResponse(201, { isLiked: true, like: newLike }, "Liked comment successfully"));
  }
});

// [PHASE 1 FEATURE]: Toggle like on a tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id
  });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    return res
      .status(200)
      .json(new ApiResponse(200, { isLiked: false }, "Unliked tweet successfully"));
  } else {
    const newLike = await Like.create({
      tweet: tweetId,
      likedBy: req.user._id
    });
    return res
      .status(201)
      .json(new ApiResponse(201, { isLiked: true, like: newLike }, "Liked tweet successfully"));
  }
});

// [PHASE 1 FEATURE]: Fetch all videos liked by the logged-in user
const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
        video: { $exists: true, $ne: null }
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideo",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: { $first: "$owner" }
            }
          }
        ]
      }
    },
    {
      $addFields: {
        likedVideo: { $first: "$likedVideo" }
      }
    }
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
});

export {
  toggleVideoLike,
  toggleCommentLike,
  toggleTweetLike,
  getLikedVideos
};
