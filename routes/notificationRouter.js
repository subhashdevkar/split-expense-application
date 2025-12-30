import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  getAllNotification,
  markAsRead,
  saveFcmtoken,
} from "../controllers/notificationController.js";

const notificationRouter = express.Router();

notificationRouter.get("/", isAuth, getAllNotification);
notificationRouter.post("/", isAuth, saveFcmtoken);
notificationRouter.post("/:notificationId", isAuth, markAsRead);

export default notificationRouter;
