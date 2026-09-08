/*
 ============================================================================
 [PHASE 1 & 2 FEATURE]: Video Schema Definition
 ============================================================================
 [PHASE 1 FEATURE]: videoFile, thumbnail, title, description, duration, views, isPublished, owner.
 [PHASE 2 FEATURE]: category, tags, playbackProgress (resume playback), full-text search indexes.
*/

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    // [PHASE 1 FEATURE]: Core video media & details
    videoFile: {
      type: String, // Cloudinary URL
      required: true
    },
    thumbnail: {
      type: String, // Cloudinary URL
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    duration: {
      type: Number, // duration in seconds
      required: true
    },
    views: {
      type: Number,
      default: 0
    },
    isPublished: {
      type: Boolean,
      default: true
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    // [PHASE 2 FEATURE]: Video Category & Tags for search & filtering
    category: {
      type: String,
      default: "General",
      index: true
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ]
  },
  {
    timestamps: true
  }
);

// [PHASE 2 FEATURE]: Full-text search index on title, description, and tags
videoSchema.index(
  {
    title: "text",
    description: "text",
    tags: "text"
  },
  {
    weights: {
      title: 10,
      tags: 5,
      description: 1
    },
    name: "video_text_search_index"
  }
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);