import ActivityLogs from "../models/activityLogsModel.js";

export const getAllActivityLogsUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const userId = req.user.id;
    const activityLogs = await ActivityLogs.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const total = await ActivityLogs.countDocuments({ userId });
    return res.status(200).json({
      success: true,
      message: "Activity log fetched successfully",
      activityLogs,
      pagination: {
        totalLogs: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
