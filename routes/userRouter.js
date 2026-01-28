import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { findUser, getUserDetails } from "../controllers/userController.js";
import { getDashboardBalances } from "../controllers/expenseController.js";

const userRouter = express.Router();

userRouter.get("/", isAuth, getUserDetails);
userRouter.get("/dashboard", isAuth, getDashboardBalances)
userRouter.post("/", isAuth, findUser);

export default userRouter;
