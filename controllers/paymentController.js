import transporter from "../configs/nodemailer.js";
import ActivityLogs from "../models/activityLogsModel.js";
import Balance from "../models/balanceModel.js";

export const sendPaymentReminder = async (req, res) => {
  try {
    const { balanceId } = req.body;
    const creditorId = req.user.id;
    if (!balanceId) {
      return res.status(404).json({
        success: false,
        message: "Balance id is required",
      });
    }
    const balance = await Balance.findById(balanceId).populate({
      path: "fromUser toUser",
      select: "name email fcmToken",
    });
    if (!balance) {
      return res
        .status(404)
        .json({ success: false, message: "Balance not found" });
    }
    if (balance.toUser._id.toString() !== creditorId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized to send reminder" });
    }
    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: balance?.fromUser?.email,
      subject: `Payment reminder: ${balance.toUser.name}`,
      html: `
      <h2> Payment Reminder</h2>
          <p>You owe <strong>₹${balance.balance.toFixed(
        2
      )}</strong> to <strong>${balance.toUser.name}</strong></p>
          <p>Group: ${balance.groupName || "Shared Expense"}</p>
          <p>Please settle soon! </p>
      `,
      text: `You owe ${balance.balance.toFixed(2)} to ${balance.toUser.name}`,
    };
    // await transporter.sendMail(mailOption);
    await ActivityLogs.create({
      userId: balance.fromUser._id,
      action: `You owe ${balance.balance.toFixed(2)} to ${balance.toUser.name}`,
      entityType: "Reminder",
      entityId: balance._id,
    });
    await ActivityLogs.create({
      userId: creditorId,
      action: `Sent reminder to ${balance.fromUser.name} for ₹${balance.balance.toFixed(2)}`,
      entityType: "Reminder",
      entityId: balance._id,
    });
    return res
      .status(200)
      .json({ success: true, message: "Reminder sent successfully" });
  } catch (error) {
    console.log("error in payment remider:", error)
    return res.status(500).json({ success: false, message: error.message });
  }
};
