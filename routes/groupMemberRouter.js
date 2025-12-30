import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  addMemberInGroup,
  getAllGroupMembers,
  removeMemberFromGroup,
} from "../controllers/groupMemberController.js";

const groupMemberRouter = express.Router();

groupMemberRouter.get("/:groupId", getAllGroupMembers);
groupMemberRouter.post("/", isAuth, addMemberInGroup);
groupMemberRouter.delete("/", isAuth, removeMemberFromGroup);

export default groupMemberRouter;
