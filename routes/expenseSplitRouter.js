import express from "express";
import { getExpenseSplits } from "../controllers/expenseSplitController.js";

const expenseSplitRouter = express.Router();

expenseSplitRouter.get("/:expenseId", getExpenseSplits);

export default expenseSplitRouter;
