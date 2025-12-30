import express from "express";
import {
  addExpense,
  deleteExpense,
  editExpense,
  getGroupSummary,
} from "../controllers/expenseController.js";
import validate from "../middlewares/validation.js";
import { addExpenseSchema } from "../validations/expenseValidation.js";
const expenseRouter = express.Router();

expenseRouter.get("/:groupId", getGroupSummary);
expenseRouter.post("/", validate(addExpenseSchema), addExpense);
expenseRouter.put("/", validate(addExpenseSchema), editExpense);
expenseRouter.delete("/", deleteExpense);

export default expenseRouter;
