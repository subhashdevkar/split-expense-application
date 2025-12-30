import mongoose from "mongoose";

const settlementSchema = mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    payer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: { type: Number, min: 1, required: true },
    method: { type: String, enum: ["cash", "upi", "bank"], required: true },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

const Settlement = mongoose.model("Settlement", settlementSchema);

export default Settlement;
