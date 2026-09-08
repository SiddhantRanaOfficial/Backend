/*
 ============================================================================
 [PHASE 1 & 2 FEATURE]: Comment Express Routes
 ============================================================================
 [PHASE 1 FEATURE]: Base video comments endpoints.
 [PHASE 2 FEATURE]: Comment reply thread endpoints.
*/

import { Router } from "express";
import {
  addComment,
  addCommentReply,
  deleteComment,
  getCommentReplies,
  getVideoComments,
  updateComment
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

// [PHASE 1 FEATURE]: Video top-level comments
router.route("/:videoId").get(getVideoComments).post(addComment);
router.route("/c/:commentId").patch(updateComment).delete(deleteComment);

// [PHASE 2 FEATURE]: Comment nested replies
router.route("/reply/:commentId").get(getCommentReplies).post(addCommentReply);

export default router;
