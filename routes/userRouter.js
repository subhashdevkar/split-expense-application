import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { findUser, getUserDetails } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/", isAuth, getUserDetails);
userRouter.post("/", isAuth, findUser);

export default userRouter;
