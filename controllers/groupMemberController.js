import GroupMember from "../models/groupMemberModel.js";
import Group from "../models/groupModel.js";

export const addMemberInGroup = async (req, res) => {
  try {
    const { memberId, groupId } = req.body;
    const adminId = req.user.id;
    const group = await Group.findById(groupId);
    const memberAlreadyInGroup = await GroupMember.findOne({
      memberId,
      groupId,
    });
    if (memberAlreadyInGroup) {
      return res
        .status(409)
        .json({ success: false, message: "Member is already in group" });
    }
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
    const groupMember = await GroupMember.create({ groupId, memberId });
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
    const group = await Group.findById(groupId);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group is not found" });
    }
    const groupMembers = await GroupMember.find({ groupId })
      .populate("memberId", "name email")
      .lean();
    if (!groupMembers) {
      return res
        .status(404)
        .json({ success: false, message: "Group member not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Group members fetched successfully",
      groupMembers,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
