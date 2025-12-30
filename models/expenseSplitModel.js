import mongoose from "mongoose";

const expenseSplitSchema = mongoose.Schema(
  {
    expenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expense",
      required: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shareAmount: { type: String, required: true },
  },
  { timestamps: true }
);
const ExpenseSplit = mongoose.model("ExpenseSplit", expenseSplitSchema);
export default ExpenseSplit;
