/*
 ============================================================================
 [PHASE 1 & 2 FEATURE]: Video Comment Schema
 ============================================================================
 [PHASE 1 FEATURE]: Content, video reference, and owner relationship.
 [PHASE 2 FEATURE]: parentComment field for nested comment replies & threads.
*/

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchema = new Schema(
  {
    // [PHASE 1 FEATURE]: Base comment fields
    content: {
      type: String,
      required: true
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    // [PHASE 2 FEATURE]: Optional reference to parent comment for nested replies
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null
    }
  },
  {
    timestamps: true
  }
);

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model("Comment", commentSchema);