import mongoose from "mongoose";
import transporter from "../configs/nodemailer.js";
import Balance from "../models/balanceModel.js";
import Notification from "../models/notificationModel.js";
import Settlement from "../models/settlementModel.js";
import notificationQueue from "../queues/notificationQueue.js";
import { sendPush } from "../services/sendPush.js";
import redis from "../configs/redis.js";

export const settlementPayment = async (req, res) => {
  try {
    const { groupId, fromUser, toUser, amount, method, note } = req.body;
    const gId = new mongoose.Types.ObjectId(groupId);
    const aId = new mongoose.Types.ObjectId(fromUser);
    const bId = new mongoose.Types.ObjectId(toUser);
    if (!groupId || !fromUser || !toUser || !amount || !method || !note) {
      return res.status(404).json({
        success: false,
        message: "All details are required",
      });
    }
    const pairNetBalance = await Balance.aggregate([
      {
        $match: {
          groupId: gId,
          $or: [
            { fromUser: aId, toUser: bId },
            { fromUser: bId, toUser: aId },
          ],
        },
      },
      {
        $group: {
          _id: null,
          net: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $eq: ["$fromUser", aId],
                    },
                    {
                      $eq: ["$toUser", bId],
                    },
                  ],
                },
                { $ifNull: ["$balance", 0] },
                {
                  $multiply: [{ $ifNull: ["$balance", 0] }, -1],
                },
              ],
            },
          },
        },
      },
    ]);
    const netResult = pairNetBalance[0];
    if (!netResult) {
      return res
        .status(404)
        .json({ success: false, message: "Balance ledger not found" });
    }
    if (amount !== netResult.net) {
      return res.status(409).json({
        success: false,
        message: `Amount should be exact ${netResult.net}`,
      });
    }
    const settlement = await Settlement.create({
      groupId: groupId,
      payer: fromUser,
      receiver: toUser,
      amount,
      method,
      note,
    });
    const settlementUserDetails = await settlement.populate("payer receiver");

    // await notificationQueue.add("settlement-received", {
    //   receiver: {
    //     _id: settlementUserDetails?.receiver._id,
    //     email: settlementUserDetails?.receiver.email,
    //     fcmToken: settlementUserDetails?.receiver.fcmToken,
    //   },
    //   payer: {
    //     _id: settlementUserDetails?.payer._id,
    //     name: settlementUserDetails?.payer.name,
    //   },
    //   amount,
    //   settlementId: settlement._id,
    // });
    await Balance.deleteMany({
      $or: [
        { fromUser: fromUser, toUser: toUser },
        { fromUser: toUser, toUser: fromUser },
      ],
    });
    await Promise.all([
      redis.del(`group:summary:${groupId}`),
      redis.del(`group:balance:${groupId}`),
    ]);
    return res
      .status(201)
      .json({ success: true, message: "Payment settled successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
