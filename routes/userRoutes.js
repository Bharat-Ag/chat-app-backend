import express from "express"
import { checkAuth, login, onlineVisibility, resetPassword, signup, updateProfile } from "../controllers/userController.js";
import { protectRoute } from "../middleware/auth.js";
const userRouter = express.Router()

userRouter.post("/signup", signup)
userRouter.post("/login", login)
userRouter.put("/update-profile", protectRoute, updateProfile)
userRouter.get("/check", protectRoute, checkAuth)
userRouter.put("/reset-password", protectRoute, resetPassword)
userRouter.put("/online-visibility", protectRoute, onlineVisibility)
userRouter.put("/online-visibility", protectRoute, onlineVisibility)
// userRouter.post("/save-fcm-token", protectRoute, saveFcmToken);


export default userRouter;