import mongoose from "mongoose";

const expenseSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, required: true },
    paidBy: [
      {
        _id: false,
        userId: { type: mongoose.Schema.Types.ObjectId },
        amount: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    splitType: {
      type: String,
      enum: ["equal", "exact", "percentage", "share"],
    },
  },
  { timestamps: true }
);

const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;
