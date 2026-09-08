/*
 ============================================================================
 [PHASE 1 & 2 FEATURE]: Video Express Routes
 ============================================================================
 [PHASE 1 FEATURE]: Video publishing, playback, update, and search routes.
 [PHASE 2 FEATURE]: Trending feed, playback progress (continue watching) routes.
*/

import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getContinueWatching,
  getTrendingVideos,
  getVideoById,
  publishAVideo,
  savePlaybackProgress,
  togglePublishStatus,
  updateVideo
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT);

// [PHASE 2 FEATURE]: Special feeds & progress routes
router.route("/trending").get(getTrendingVideos);
router.route("/continue-watching").get(getContinueWatching);
router.route("/progress/:videoId").post(savePlaybackProgress);

// [PHASE 1 FEATURE]: Standard video routes
router
  .route("/")
  .get(getAllVideos)
  .post(
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1
      },
      {
        name: "thumbnail",
        maxCount: 1
      }
    ]),
    publishAVideo
  );

router
  .route("/:videoId")
  .get(getVideoById)
  .delete(deleteVideo)
  .patch(upload.single("thumbnail"), updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;
