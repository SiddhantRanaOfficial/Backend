/*
 ============================================================================
 [PHASE 2 FEATURE]: Tweet / Community Post Schema Definition
 ============================================================================
 Description: Allows users to create short community text posts on their channel.
*/

import mongoose, { Schema } from "mongoose";

const tweetSchema = new Schema(
  {
    content: {
      type: String,
      required: true
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

export const Tweet = mongoose.model("Tweet", tweetSchema);
