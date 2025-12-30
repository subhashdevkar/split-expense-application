import mongoose from "mongoose";

const balanceSchema = mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    expenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expense",
      // required: true,
    },
    settlementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Settlement",
      // required: true,
    },
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    balance: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

const Balance = mongoose.model("Balance", balanceSchema);

export default Balance;
