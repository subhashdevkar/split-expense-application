import mongoose from "mongoose";

const groupMemberSchema = mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: { type: String, enum: ["admin", "member"], default: "member" },
  },
  { timestamps: true }
);

const GroupMember = mongoose.model("GroupMember", groupMemberSchema);

export default GroupMember;
