/*
 ============================================================================
 [PHASE 2 FEATURE]: Tweet Express Routes
 ============================================================================
 Express router mapping tweet operations to authenticated user endpoints.
*/

import { Router } from "express";
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  updateTweet
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Secure all tweet routes
router.use(verifyJWT);

router.route("/").post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;
