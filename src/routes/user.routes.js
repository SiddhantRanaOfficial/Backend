import { Router } from "express";
import {
  updateUserAvatar,
  updateProfile,
  updateUserCoverImage,
  refreshAccessToken,
  deleteAccount,
  changeCurrentPassword,
  getCurrentUser,
  logoutUser,
  loginUser,
  registerUser,
  getUserChannelProfile
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1
    },
    {
      name: "coverImage",
      maxCount: 1
    }
  ]),
  registerUser
);

router.route("/login").post(
  upload.none(),
  loginUser
);

// Secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/update-profile").patch(verifyJWT, updateProfile);
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
router.route("/avatar-image").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/delete-account").delete(verifyJWT, deleteAccount);
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);

export default router;