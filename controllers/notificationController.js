import Notification from "../models/notificationModel.js";
import User from "../models/userModel.js";

export const saveFcmtoken = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;
    if (!token) {
      return res
        .status(404)
        .json({ success: false, message: "Fcm token is required" });
    }
    await User.findByIdAndUpdate(userId, { fcmToken: token });
    return res
      .status(200)
      .json({ success: true, message: "Fcm token is saved successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = unreadOnly ? { userId, isRead: false } : { userId };
    const [notifications, unreadCount, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),

      Notification.countDocuments({ userId, isRead: false }),
      Notification.countDocuments({ userId }),
    ]);

    return res.status(200).json({
      success: true,
      message: notifications.length
        ? "Notification fetched successfully"
        : "No notifications",
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        unreadCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    const { bulk = false } = req.query;
    if (!notificationId) {
      return res
        .status(404)
        .json({ success: false, message: "Notification id is required " });
    }
    // if()
    if (bulk) {
      const result = await Notification.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );
      return res.status(200).json({
        success: true,
        message: `Marked ${result.modifiedCount} notification as read`,
      });
    } else {
      const notification = await Notification.findOneAndUpdate(
        { userId, _id: notificationId },
        {
          isRead: true,
        },
        { new: true }
      ).lean();
      if (!notification) {
        return res
          .status(404)
          .json({ success: false, message: "Notification not Found" });
      }
      return res
        .status(200)
        .json({ success: true, message: "Notification marked as read" });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
