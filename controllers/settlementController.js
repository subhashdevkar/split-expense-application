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
    // const { groupId, fromUser, toUser, amount, method, note } = req.body;
    const { balanceId, method, note } = req.body
    const userId = req.user.id
    if (!balanceId || !method || !note) {
      return res.status(404).json({
        success: false,
        message: "All details are required",
      });
    }
    const balanceDetail = await Balance.findById(balanceId)
    if (!balanceDetail) {
      return res.status(404).json({ success: false, message: "balance details not found" })
    }
    if (userId !== balanceDetail.fromUser || userId !== balanceDetail.toUser) {
      return res.status(409).json({ success: false, message: "You are not authorised to settle up this transaction" })
    }
    const gId = new mongoose.Types.ObjectId(balanceDetail.groupId);
    const aId = new mongoose.Types.ObjectId(balanceDetail.fromUser);
    const bId = new mongoose.Types.ObjectId(balanceDetail.toUser);
    const groupId = balanceDetail.groupId
    const fromUser = balanceDetail.fromUser
    const toUser = balanceDetail.toUser
    const amount = balanceDetail.balance
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
    console.log("amount:", amount, "netResult:", netResult.net)
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
    console.log("error:", error)
    return res.status(500).json({ success: false, message: error.message });
  }
};
