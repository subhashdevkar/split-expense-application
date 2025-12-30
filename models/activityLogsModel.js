import mongoose from "mongoose";

const activityLogSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: { type: String, required: true },
    entityType: {
      type: String,
      enum: ["Expense", "Group", "Reminder", "Settlement"],
      required: true,
    },
    entityId: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true }
);

const ActivityLogs = mongoose.model("Activity_log", activityLogSchema);

export default ActivityLogs;
