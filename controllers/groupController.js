import mongoose from "mongoose";
import GroupMember from "../models/groupMemberModel.js";
import Group from "../models/groupModel.js";
import ActivityLogs from "../models/activityLogsModel.js";
import Balance from "../models/balanceModel.js";

export const createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    const adminId = req.user.id;
    if (!name || name.trim().length < 2) {
      return res
        .status(400)
        .json({ success: false, message: "Valid group name is required" });
    }
    const group = await Group.create({ name, createdBy: adminId });
    await GroupMember.create({
      groupId: group._id,
      memberId: adminId,
      role: "admin",
    });
    await ActivityLogs.create({
      userId: adminId,
      action: `You have created a new group ${name}`,
      entityType: "Group",
      entityId: group._id,
    });
    return res
      .status(201)
      .json({ success: true, message: "Group created successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const editGroup = async (req, res) => {
  try {
    const { groupId, name } = req.body;
    const adminId = req.user.id;
    if (!groupId || !name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Valid Group id and name is required",
      });
    }
    const group = await Group.findById(groupId);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }
    if (group.createdBy.toString() !== adminId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Your are not authorized to change the group name",
      });
    }
    group.name = name;
    await group.save();
    const groupMembers = await GroupMember.find({ groupId })
      .populate("memberId")
      .lean();
    const logs = groupMembers.map((member) => ({
      userId: member?.memberId?._id,
      action: `${
        member.memberId._id.toString() === adminId.toString()
          ? "You"
          : member?.memberId?.name
      } has edited the ${name} group name`,
      entityType: "Group",
      entityId: group._id,
    }));
    await ActivityLogs.insertMany(logs);
    return res
      .status(200)
      .json({ success: true, message: "Group name updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    const adminId = req.user.id;
    if (!groupId) {
      return res
        .status(404)
        .json({ success: false, message: "Group id is missing " });
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
        message: "You are not authorized to delete the group",
      });
    }
    const groupMembers = await GroupMember.find({ groupId }).populate(
      "memberId"
    );
    const pendingBalances = await Balance.find({ groupId });
    if (pendingBalances.length > 0) {
      return res.status(401).json({
        success: false,
        message:
          "Group can not be delete as there are still some settlements are remaining",
      });
    }
    const logs = groupMembers.map((member) => ({
      userId: member?.memberId?._id,
      action: `${
        member.memberId._id.toString() === adminId.toString()
          ? "You"
          : member?.memberId?.name
      } has deleted the ${group.name} group name`,
      entityType: "Group",
      entityId: group._id,
    }));
    await ActivityLogs.insertMany(logs);
    await Group.findByIdAndDelete(groupId);
    await GroupMember.deleteMany({ groupId });
    return res
      .status(200)
      .json({ success: true, message: "Group deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllGroupOfUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const groups = await GroupMember.find({ memberId: userId }).populate(
      "groupId"
    );
    console.log(groups);
    return res.status(200).json({
      success: true,
      message: "All group fetched successfully",
      groups,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
