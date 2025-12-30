import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import { getAllActivityLogsUser } from "../controllers/activityLogController.js";

const activityLogsRouter = express.Router();

activityLogsRouter.get("/", isAuth, getAllActivityLogsUser);

export default activityLogsRouter;
