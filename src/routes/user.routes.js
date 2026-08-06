import { Router } from "express";
import { deleteAccount, changeCurrentPassword, getCurrentUser, logoutUser, loginUser, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { updateProfile } from "../controllers/user.controller.js";

const router = Router()

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1
    }, {
      name: "coverImage",
      maxCount: 1
    }
  ]),
  registerUser
)

router.route("/login").post(loginUser);

router.route("/logout").post(
  verifyJWT,
  logoutUser
);

router.route("/current-user").get(
  verifyJWT,
  getCurrentUser
);

router.route("/change-password").post(
  verifyJWT,
  changeCurrentPassword
);

router.route("/update-Profile").post(
  verifyJWT,
  updateProfile
)

router.route("/delete-account").post(
  verifyJWT,
  deleteAccount
)

export default router