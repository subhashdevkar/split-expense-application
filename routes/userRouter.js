import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { findUser } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.post("/", isAuth, findUser);

export default userRouter;
