import transporter from "../configs/nodemailer.js";
import Friend from "../models/friendModel.js";
import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";
import { sendPush } from "../services/sendPush.js";

export const sendRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    if (!receiverId) {
      return res
        .status(404)
        .json({ success: false, message: "Id is required" });
    }
    const senderId = req.user.id;
    const alreadySendRequest = await Friend.findOne({
      receiverId,
      senderId,
      $or: [{ status: "pending" }, { status: "accepted" }],
    });
    if (alreadySendRequest) {
      return res
        .status(409)
        .json({ success: false, message: "Already requested" });
    }
    const friend = await Friend.create({ receiverId, senderId });
    await friend.populate("receiverId senderId");
    if (friend?.receiverId?.fcmToken) {
      await sendPush(
        friend?.receiverId?.fcmToken,
        "New Friend request received",
        `${friend?.senderId?.name} has sent you a friend request`
      );
    }
    await Notification.create({
      userId: receiverId,
      title: "New Friend request received",
      description: `${friend?.senderId?.name} has sent you a friend request`,
    });
    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: friend?.receiverId?.email,
      subject: "New Friend request received",
      text: `${friend?.senderId?.name} has sent you a friend request`,
    };
    // await transporter.sendMail(mailOption);
    return res
      .status(201)
      .json({ success: true, message: "Request sent successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const requestReceiverId = req.user.id;
    if (!requestId) {
      return res
        .status(404)
        .json({ success: false, message: "Request id is required" });
    }
    const request = await Friend.findById(requestId);
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "request not found" });
    }
    if (request.receiverId.toString() !== requestReceiverId.toString()) {
      return res
        .status(401)
        .json({ success: false, message: "You are not authorized" });
    }
    request.status = "accepted";
    await request.save();
    await User.findByIdAndUpdate(request.senderId, {
      $push: { friends: request.receiverId },
    });
    await User.findByIdAndUpdate(request.receiverId, {
      $push: { friends: request.senderId },
    });
    return res
      .status(200)
      .json({ success: true, message: "Friend request accepted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
export const rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const requestReceiverId = req.user.id;
    const request = await Friend.findById(requestId);
    if (!request) {
      return res
        .status(404)
        .json({ success: false, message: "Request is not found" });
    }
    if (request.receiverId.toString() !== requestReceiverId.toString()) {
      return res
        .status(401)
        .json({ success: false, message: "You are not authorized" });
    }
    request.status = "rejected";
    await request.save();
    return res
      .status(200)
      .json({ success: true, message: "request rejected successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
export const removeFromFriends = async (req, res) => {
  try {
    const { friendId, requestId } = req.body;
    const userId = req.user.id;
    if (!friendId) {
      return res
        .status(404)
        .json({ success: false, message: "Friend id is required" });
    }

    await Friend.findByIdAndDelete(requestId);
    await User.findByIdAndUpdate(friendId, { $pull: { friends: userId } });
    await User.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
    return res
      .status(200)
      .json({ success: true, message: "Removed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .populate("friends", "name email")
      .lean();
    const friends = user?.friends || [];
    return res.status(200).json({
      success: true,
      message: "Friends fetched successfully",
      friends,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllRequests = async (req, res) => {
  try {
    const user = req.user;
    const requests = await Friend.find({
      receiverId: user.id,
      status: "pending",
    })
      .populate("senderId", "name email")
      .populate("receiverId", "name email");
    if (!requests) {
      return res
        .status(401)
        .json({ success: true, message: "no request found" });
    }
    return res.status(200).json({
      success: true,
      message: "Fetched all the requests",
      requests,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
