import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  acceptRequest,
  getAllFriends,
  rejectRequest,
  removeFromFriends,
  sendRequest,
} from "../controllers/friendController.js";

const friendRouter = express.Router();

friendRouter.get("/", isAuth, getAllFriends);
friendRouter.post("/send-request", isAuth, sendRequest);
friendRouter.post("/accept-request", isAuth, acceptRequest);
friendRouter.post("/reject-request", isAuth, rejectRequest);
friendRouter.delete("/remove-friend", isAuth, removeFromFriends);

export default friendRouter;
