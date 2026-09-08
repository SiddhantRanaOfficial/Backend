/*
 ============================================================================
 [PHASE 2 FEATURE]: Creator Dashboard Controller Implementation
 ============================================================================
 Provides analytics endpoints for channel stats (total views, subscribers, likes, videos)
 and creator video management feeds.
*/

import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.models.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// [PHASE 2 FEATURE]: Get overall channel analytics & stats
const getChannelStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Calculate total subscribers for this channel
  const totalSubscribers = await Subscription.countDocuments({ channel: userId });

  // 2. Aggregate total views and total video count for this channel
  const videoStats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$views" },
        totalVideos: { $sum: 1 }
      }
    }
  ]);

  const totalViews = videoStats[0]?.totalViews || 0;
  const totalVideos = videoStats[0]?.totalVideos || 0;

  // 3. Aggregate total likes across all videos belonging to this channel
  const likesStats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes"
      }
    },
    {
      $project: {
        likesCount: { $size: "$likes" }
      }
    },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: "$likesCount" }
      }
    }
  ]);

  const totalLikes = likesStats[0]?.totalLikes || 0;

  const channelStats = {
    totalSubscribers,
    totalViews,
    totalVideos,
    totalLikes
  };

  return res
    .status(200)
    .json(new ApiResponse(200, channelStats, "Channel stats fetched successfully"));
});

// [PHASE 2 FEATURE]: Fetch all videos uploaded by channel creator with performance metrics
const getChannelVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes"
      }
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "video",
        as: "comments"
      }
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
        commentsCount: { $size: "$comments" }
      }
    },
    {
      $project: {
        likes: 0,
        comments: 0
      }
    },
    {
      $sort: { createdAt: -1 }
    }
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Creator channel videos fetched successfully"));
});

export {
  getChannelStats,
  getChannelVideos
};
