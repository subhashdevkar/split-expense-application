import mongoose from "mongoose";
import Balance from "../models/balanceModel.js";

export const getGroupNetBalance = async (groupId) => {
  const gId = new mongoose.Types.ObjectId(groupId);
  console.log("groupId value:", gId, typeof gId);
  console.log("isValid ObjectId:", mongoose.Types.ObjectId.isValid(gId));
  const rows = await Balance.aggregate([
    {
      $match: {
        groupId: gId,
      },
    },
    {
      $project: {
        groupId: 1,
        balance: 1,
        aUser: {
          $cond: [{ $lt: ["$fromUser", "$toUser"] }, "$fromUser", "$toUser"],
        },
        bUser: {
          $cond: [{ $lt: ["$fromUser", "$toUser"] }, "$toUser", "$fromUser"],
        },
        dir: {
          $cond: [
            {
              $eq: [
                "$fromUser",
                {
                  $cond: [
                    {
                      $lt: ["$fromUser", "$toUser"],
                    },
                    "$fromUser",
                    "$toUser",
                  ],
                },
              ],
            },
            1,
            -1,
          ],
        },
      },
    },
    {
      $group: {
        _id: {
          groupId: "$groupId",
          aUser: "$aUser",
          bUser: "$bUser",
        },
        net: {
          $sum: { $multiply: ["$balance", "$dir"] },
        },
      },
    },
    {
      $match: {
        net: { $ne: 0 },
      },
    },
    {
      $project: {
        groupId: "$_id.groupId",
        fromUser: {
          $cond: [{ $gt: ["$net", 0] }, "$_id.aUser", "$_id.bUser"],
        },
        toUser: {
          $cond: [{ $gt: ["$net", 0] }, "$_id.bUser", "$_id.aUser"],
        },
        balance: { $abs: "$net" },
        _id: 0,
      },
    },
  ]);

  return rows;
};
