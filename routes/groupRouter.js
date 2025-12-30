import express from "express";
import { isAuth } from "../middlewares/isAuth.js";
import {
  createGroup,
  deleteGroup,
  editGroup,
  getAllGroupOfUser,
} from "../controllers/groupController.js";
import { getGroupBalance } from "../controllers/expenseController.js";

const groupRouter = express.Router();

groupRouter.get("/", isAuth, getAllGroupOfUser);
groupRouter.get("/balance-summary/:groupId", getGroupBalance);
groupRouter.post("/", isAuth, createGroup);
groupRouter.put("/", isAuth, editGroup);
groupRouter.delete("/", isAuth, deleteGroup);

export default groupRouter;
