/*
 ============================================================================
 [PHASE 1 & 2 FEATURE]: Comment Controller Implementation
 ============================================================================
 [PHASE 1 FEATURE]: Top-level comment listing, creation, updates, and deletion.
 [PHASE 2 FEATURE]: Nested comment replies and thread retrieval.
*/

import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// [PHASE 1 FEATURE]: Fetch top-level comments for a video with pagination
const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const commentsAggregate = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
        parentComment: null // [PHASE 2 FEATURE]: Only fetch top-level comments
      }
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
    // [PHASE 2 FEATURE]: Count reply threads for each top-level comment
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "parentComment",
        as: "replies"
      }
    },
    {
      $addFields: {
        owner: { $first: "$owner" },
        repliesCount: { $size: "$replies" }
      }
    },
    {
      $project: {
        replies: 0
      }
    },
    {
      $sort: { createdAt: -1 }
    }
  ]);

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10)
  };

  const comments = await Comment.aggregatePaginate(commentsAggregate, options);

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Video comments fetched successfully"));
});

// [PHASE 1 FEATURE]: Add a top-level comment to a video
const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  if (!content || !content.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  const comment = await Comment.create({
    content: content.trim(),
    video: videoId,
    owner: req.user._id,
    parentComment: null
  });

  return res
    .status(201)
    .json(new ApiResponse(201, comment, "Comment added successfully"));
});

// [PHASE 2 FEATURE]: Add a nested reply to a parent comment
const addCommentReply = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid parent comment ID");
  }

  if (!content || !content.trim()) {
    throw new ApiError(400, "Reply content is required");
  }

  const parentComment = await Comment.findById(commentId);
  if (!parentComment) {
    throw new ApiError(404, "Parent comment not found");
  }

  const reply = await Comment.create({
    content: content.trim(),
    video: parentComment.video,
    owner: req.user._id,
    parentComment: commentId
  });

  return res
    .status(201)
    .json(new ApiResponse(201, reply, "Comment reply added successfully"));
});

// [PHASE 2 FEATURE]: Get all nested replies for a specific parent comment
const getCommentReplies = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid parent comment ID");
  }

  const replies = await Comment.aggregate([
    {
      $match: {
        parentComment: new mongoose.Types.ObjectId(commentId)
      }
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
      $sort: { createdAt: 1 }
    }
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, replies, "Comment replies fetched successfully"));
});

// [PHASE 1 FEATURE]: Update comment content (Owner only)
const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  if (!content || !content.trim()) {
    throw new ApiError(400, "Comment content cannot be empty");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You do not have permission to update this comment");
  }

  comment.content = content.trim();
  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

// [PHASE 1 FEATURE]: Delete a comment and its nested replies (Owner only)
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You do not have permission to delete this comment");
  }

  // [PHASE 2 FEATURE]: Delete comment and any nested replies attached to it
  await Comment.deleteMany({
    $or: [{ _id: commentId }, { parentComment: commentId }]
  });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment and replies deleted successfully"));
});

export {
  getVideoComments,
  addComment,
  addCommentReply,
  getCommentReplies,
  updateComment,
  deleteComment
};
