/*
 ============================================================================
 [PHASE 1 & 2 FEATURE]: Video Controller Implementation
 ============================================================================
 [PHASE 1 FEATURE]: Video CRUD, Cloudinary upload, basic search, view counter.
 [PHASE 2 FEATURE]: Full-text search, categories/tags, trending feed, resume playback (continue watching).
*/

import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { WatchProgress } from "../models/watchProgress.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// [PHASE 1 & 2 FEATURE]: Get all videos with category filter, full-text search, sort, and pagination
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, category, sortBy = "createdAt", sortType = "desc", userId } = req.query;

  const pipeline = [];

  // [PHASE 2 FEATURE]: Full-text search with relevance scoring
  if (query) {
    pipeline.push({
      $match: {
        $text: { $search: query }
      }
    });
  }

  // [PHASE 2 FEATURE]: Category filtering
  if (category) {
    pipeline.push({
      $match: {
        category: { $regex: new RegExp(`^${category}$`, "i") }
      }
    });
  }

  // [PHASE 1 FEATURE]: User ID filtering
  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid User ID");
    }
    pipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId)
      }
    });
  }

  // Match only published videos
  pipeline.push({
    $match: {
      isPublished: true
    }
  });

  // Sort criteria
  const sortOptions = {};
  sortOptions[sortBy] = sortType === "asc" ? 1 : -1;
  pipeline.push({ $sort: sortOptions });

  // Lookup owner details
  pipeline.push({
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "owner",
      pipeline: [
        {
          $project: {
            username: 1,
            fullname: 1,
            avatar: 1
          }
        }
      ]
    }
  });

  pipeline.push({
    $addFields: {
      owner: { $first: "$owner" }
    }
  });

  const aggregate = Video.aggregate(pipeline);
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10)
  };

  const videos = await Video.aggregatePaginate(aggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

// [PHASE 1 & 2 FEATURE]: Publish a video with optional category & tags
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, category = "General", tags } = req.body;

  if (!title || !title.trim() || !description || !description.trim()) {
    throw new ApiError(400, "Title and description are required");
  }

  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file is required");
  }
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is required");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile) {
    throw new ApiError(500, "Video upload failed");
  }
  if (!thumbnail) {
    throw new ApiError(500, "Thumbnail upload failed");
  }

  // Parse tags if provided as string or array
  let parsedTags = [];
  if (tags) {
    parsedTags = Array.isArray(tags)
      ? tags
      : tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  }

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title: title.trim(),
    description: description.trim(),
    duration: videoFile.duration || 0,
    owner: req.user._id,
    isPublished: true,
    category: category.trim(),
    tags: parsedTags
  });

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully"));
});

// [PHASE 1 & 2 FEATURE]: Get video details and include playback progress if available
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { views: 1 } },
    { new: true }
  ).populate("owner", "username fullname avatar");

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { watchHistory: videoId }
    });
  }

  // [PHASE 2 FEATURE]: Fetch playback progress timestamp if user is logged in
  let playbackProgress = null;
  if (req.user) {
    playbackProgress = await WatchProgress.findOne({
      user: req.user._id,
      video: videoId
    });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { video, playbackProgress },
        "Video fetched successfully"
      )
    );
});

// [PHASE 2 FEATURE]: Fetch Trending Videos feed based on views and likes
const getTrendingVideos = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const trendingVideos = await Video.aggregate([
    {
      $match: {
        isPublished: true
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
      $addFields: {
        likesCount: { $size: "$likes" },
        // Trending score calculation: views + (likes * 3)
        trendingScore: {
          $add: ["$views", { $multiply: [{ $size: "$likes" }, 3] }]
        }
      }
    },
    {
      $sort: { trendingScore: -1, createdAt: -1 }
    },
    {
      $limit: parseInt(limit, 10)
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              fullname: 1,
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
    },
    {
      $project: {
        likes: 0
      }
    }
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, trendingVideos, "Trending videos fetched successfully"));
});

// [PHASE 2 FEATURE]: Save user playback progress timestamp for resume playback
const savePlaybackProgress = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { currentTime, completed = false } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  if (typeof currentTime !== "number" || currentTime < 0) {
    throw new ApiError(400, "Valid currentTime in seconds is required");
  }

  const progress = await WatchProgress.findOneAndUpdate(
    { user: req.user._id, video: videoId },
    {
      $set: {
        currentTime,
        completed
      }
    },
    { upsert: true, new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, progress, "Playback progress saved successfully"));
});

// [PHASE 2 FEATURE]: Fetch user's "Continue Watching" list
const getContinueWatching = asyncHandler(async (req, res) => {
  const progressList = await WatchProgress.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user._id),
        completed: false
      }
    },
    {
      $sort: { updatedAt: -1 }
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
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
                    username: 1,
                    fullname: 1,
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
        videoDetails: { $first: "$videoDetails" }
      }
    }
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, progressList, "Continue watching list fetched successfully"));
});

// [PHASE 1 FEATURE]: Update video details
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description, category, tags } = req.body;
  const thumbnailLocalPath = req.file?.path;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You do not have permission to update this video");
  }

  if (title && title.trim()) video.title = title.trim();
  if (description && description.trim()) video.description = description.trim();
  if (category && category.trim()) video.category = category.trim();
  if (tags) {
    video.tags = Array.isArray(tags)
      ? tags
      : tags.split(",").map((tag) => tag.trim()).filter(Boolean);
  }

  if (thumbnailLocalPath) {
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (thumbnail) {
      video.thumbnail = thumbnail.url;
    }
  }

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

// [PHASE 1 FEATURE]: Delete video
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You do not have permission to delete this video");
  }

  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

// [PHASE 1 FEATURE]: Toggle publish status
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You do not have permission to modify this video");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isPublished: video.isPublished },
        `Video publish status toggled to ${video.isPublished}`
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  getTrendingVideos,
  savePlaybackProgress,
  getContinueWatching,
  updateVideo,
  deleteVideo,
  togglePublishStatus
};
