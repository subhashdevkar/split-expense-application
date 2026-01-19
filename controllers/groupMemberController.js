import mongoose from "mongoose";
import GroupMember from "../models/groupMemberModel.js";
import Group from "../models/groupModel.js";

export const addMemberInGroup = async (req, res) => {
  try {
    const { memberIds, groupId } = req.body;
    const adminId = req.user.id;
    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Required atleast one member" });
    }
    const group = await Group.findById(groupId);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group is not found" });
    }
    if (group.createdBy.toString() !== adminId) {
      return res.status(401).json({
        success: false,
        message: "Your are not authorized to add member",
      });
    }
    const exstingMembers = await GroupMember.find({
      groupId,
      memberId: { $in: memberIds },
    }).select("memberId");
    const exstingMembersIds = new Set(
      exstingMembers.map((m) => m.memberId.toString())
    );
    const newMembers = memberIds
      .filter((id) => !exstingMembersIds.has(id))
      .map((id) => ({ groupId, memberId: id }));
    if (newMembers.length === 0) {
      return res.status(409).json({
        success: false,
        message: "All users are already members of this group",
      });
    }
    await GroupMember.insertMany(newMembers);
    return res
      .status(201)
      .json({ success: true, message: "Member added successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const removeMemberFromGroup = async (req, res) => {
  try {
    const { memberId, groupId } = req.body;
    const adminId = req.user.id;
    if (!memberId || !groupId) {
      return res
        .status(404)
        .json({ success: false, message: "Member id or group id is missing" });
    }
    const group = await Group.findById(groupId);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }
    if (group.createdBy.toString() !== adminId) {
      return res.status(401).json({
        success: false,
        message: "You are not authorized to remove member",
      });
    }
    if (memberId === adminId) {
      return res.status(409).json({
        success: false,
        message:
          "You can not remove yourself from group, you can delete the group",
      });
    }
    await GroupMember.findOneAndDelete({ groupId, memberId });
    return res
      .status(200)
      .json({ success: true, message: "Member removed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
export const getAllGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!groupId) {
      return res
        .status(400)
        .json({ success: false, message: "Group ID is required" });
    }

    // Validate if groupId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Group ID format" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group is not found" });
    }
    const groupMembers = await GroupMember.find({ groupId })
      .populate("memberId", "name email")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Group members fetched successfully",
      groupMembers: groupMembers || [],
    });
  } catch (error) {
    console.log("getAllGroupMembers error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
