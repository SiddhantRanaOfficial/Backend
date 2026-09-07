/*
 ============================================================================
 [PHASE 2 FEATURE]: Express Application Core & Route Registration
 ============================================================================
 Configures application middleware, body parsing, static assets, and mounts
 all domain API routers (/users, /videos, /subscriptions, /likes, /comments, /playlists, /tweets).
*/

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Registering middlewares
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
// [PHASE 2 FEATURE]: Domain Route Imports
// ============================================================================
import userRouter from './routes/user.routes.js';
import videoRouter from './routes/video.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';
import likeRouter from './routes/like.routes.js';
import commentRouter from './routes/comment.routes.js';
import playlistRouter from './routes/playlist.routes.js';
import tweetRouter from './routes/tweet.routes.js';

// ============================================================================
// [PHASE 2 FEATURE]: Domain Route Declarations
// ============================================================================
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/playlists", playlistRouter);
app.use("/api/v1/tweets", tweetRouter);

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
