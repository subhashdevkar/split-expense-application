import mongoose from "mongoose";
import Balance from "../models/balanceModel.js";

export const getGroupNetBalance = async (groupId) => {
  const gId = new mongoose.Types.ObjectId(groupId);
  // const rows = await Balance.aggregate([
  //   {
  //     $match: {
  //       groupId: gId,
  //     },
  //   },
  //   {
  //     $project: {
  //       groupId: 1,
  //       balance: 1,
  //       aUser: {
  //         $cond: [{ $lt: ["$fromUser", "$toUser"] }, "$fromUser", "$toUser"],
  //       },
  //       bUser: {
  //         $cond: [{ $lt: ["$fromUser", "$toUser"] }, "$toUser", "$fromUser"],
  //       },
  //       dir: {
  //         $cond: [
  //           {
  //             $eq: [
  //               "$fromUser",
  //               {
  //                 $cond: [
  //                   {
  //                     $lt: ["$fromUser", "$toUser"],
  //                   },
  //                   "$fromUser",
  //                   "$toUser",
  //                 ],
  //               },
  //             ],
  //           },
  //           1,
  //           -1,
  //         ],
  //       },
  //     },
  //   },
  //   {
  //     $group: {
  //       _id: {
  //         groupId: "$groupId",
  //         aUser: "$aUser",
  //         bUser: "$bUser",
  //       },
  //       net: {
  //         $sum: { $multiply: ["$balance", "$dir"] },
  //       },
  //     },
  //   },
  //   {
  //     $match: {
  //       net: { $ne: 0 },
  //     },
  //   },
  //   {
  //     $project: {
  //       groupId: "$_id.groupId",
  //       fromUser: {
  //         $cond: [{ $gt: ["$net", 0] }, "$_id.aUser", "$_id.bUser"],
  //       },
  //       toUser: {
  //         $cond: [{ $gt: ["$net", 0] }, "$_id.bUser", "$_id.aUser"],
  //       },
  //       balance: { $abs: "$net" },
  //       _id: 0,
  //     },
  //   },

  // ]);
  const rows = await Balance.aggregate([
    {
      $match: {
        groupId: gId
      }
    },

    {
      $project: {
        balance: 1,
        aUser: {
          $cond: [
            { $lt: ["$fromUser", "$toUser"] },
            "$fromUser",
            "$toUser"
          ]
        },
        bUser: {
          $cond: [
            { $lt: ["$fromUser", "$toUser"] },
            "$toUser",
            "$fromUser"
          ]
        },
        dir: {
          $cond: [
            {
              $eq: [
                "$fromUser",
                {
                  $cond: [
                    { $lt: ["$fromUser", "$toUser"] },
                    "$fromUser",
                    "$toUser"
                  ]
                }
              ]
            },
            1,
            -1
          ]
        }
      }
    },

    {
      $group: {
        _id: {
          aUser: "$aUser",
          bUser: "$bUser"
        },
        net: {
          $sum: { $multiply: ["$balance", "$dir"] }
        }
      }
    },

    {
      $match: {
        net: { $ne: 0 }
      }
    },

    {
      $project: {
        fromUser: {
          $cond: [
            { $gt: ["$net", 0] },
            "$_id.aUser",
            "$_id.bUser"
          ]
        },
        toUser: {
          $cond: [
            { $gt: ["$net", 0] },
            "$_id.bUser",
            "$_id.aUser"
          ]
        },
        balance: { $abs: "$net" },
        _id: 0
      }
    },

    {
      $project: {
        users: ["$fromUser", "$toUser"],
        transaction: {
          fromUser: "$fromUser",
          toUser: "$toUser",
          balance: "$balance"
        }
      }
    },

    { $unwind: "$users" },

    {
      $group: {
        _id: "$users",
        transactions: { $push: "$transaction" }
      }
    },

    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user"
      }
    },

    { $unwind: "$user" },

    {
      $lookup: {
        from: "users",
        localField: "transactions.fromUser",
        foreignField: "_id",
        as: "fromUsers"
      }
    },

    {
      $lookup: {
        from: "users",
        localField: "transactions.toUser",
        foreignField: "_id",
        as: "toUsers"
      }
    },

    {
      $project: {
        userId: "$_id",
        userName: "$user.name",
        transactions: {
          $map: {
            input: "$transactions",
            as: "txn",
            in: {
              balance: "$$txn.balance",
              fromUser: {
                _id: "$$txn.fromUser",
                name: {
                  $arrayElemAt: [
                    "$fromUsers.name",
                    {
                      $indexOfArray: ["$fromUsers._id", "$$txn.fromUser"]
                    }
                  ]
                }
              },
              toUser: {
                _id: "$$txn.toUser",
                name: {
                  $arrayElemAt: [
                    "$toUsers.name",
                    {
                      $indexOfArray: ["$toUsers._id", "$$txn.toUser"]
                    }
                  ]
                }
              }
            }
          }
        },
        _id: 0
      }
    }
  ]);

  return rows;
};

