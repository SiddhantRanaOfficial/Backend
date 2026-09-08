/*
 ============================================================================
 [PHASE 2 FEATURE]: Watch Progress & Resume Playback Schema
 ============================================================================
 Stores user playback progress timestamp (currentTime) per video for "Continue Watching".
*/

import mongoose, { Schema } from "mongoose";

const watchProgressSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true
    },
    currentTime: {
      type: Number, // Playback progress in seconds
      required: true,
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Composite unique index to ensure one progress record per user per video
watchProgressSchema.index({ user: 1, video: 1 }, { unique: true });

export const WatchProgress = mongoose.model("WatchProgress", watchProgressSchema);
