/*
 ============================================================================
 [PHASE 1 & 2 FEATURE]: Express Application Core & Route Registration
 ============================================================================
 Registers middleware, CORS, cookie-parser, static assets, and mounts all domain routes.
 [PHASE 1 FEATURE]: Users, Videos, Subscriptions, Likes, Comments, Playlists, Tweets.
 [PHASE 2 FEATURE]: Creator Dashboard Analytics, Health Check Probes.
*/

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Registering global middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));

app.use(express.json({
  limit: "16kb"
}));

app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// ============================================================================
// [PHASE 1 & 2 FEATURE]: Domain Route Imports
// ============================================================================
import userRouter from './routes/user.routes.js';
import videoRouter from './routes/video.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';
import likeRouter from './routes/like.routes.js';
import commentRouter from './routes/comment.routes.js';
import playlistRouter from './routes/playlist.routes.js';
import tweetRouter from './routes/tweet.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import healthcheckRouter from './routes/healthcheck.routes.js';

// ============================================================================
// [PHASE 1 & 2 FEATURE]: Domain Route Declarations
// ============================================================================
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/playlists", playlistRouter);
app.use("/api/v1/tweets", tweetRouter);

// [PHASE 2 FEATURE]: Dashboard & Healthcheck endpoints
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);

app.get("/", (req, res) => {
  res.send("Video Streaming Service API v1 is Running 🚀");
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  console.error("========== ERROR ==========");
  console.error("Message:", err.message);
  console.error("Status Code:", err.statusCode);
  console.error("Stack:", err.stack);
  console.error("===========================");

  return res.status(statusCode).json({
    statusCode,
    data: err.data ?? null,
    success: false,
    errors: err.errors || [],
    message
  });
});

export { app };
