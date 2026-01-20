import mongoose from "mongoose";
import transporter from "../configs/nodemailer.js";
import redis from "../configs/redis.js";
import ActivityLogs from "../models/activityLogsModel.js";
import Balance from "../models/balanceModel.js";
import Expense from "../models/expenseModel.js";
import ExpenseSplit from "../models/expenseSplitModel.js";
import GroupMember from "../models/groupMemberModel.js";
import Group from "../models/groupModel.js";
import Notification from "../models/notificationModel.js";
import notificationQueue from "../queues/notificationQueue.js";
import {
  applyBalanceUpdate,
  calculateExpenseSplits,
  calculateLedgerUpdates,
  refineLedgerEntries,
  validateTotalPaidAmount,
} from "../services/expenseService.js";
import { sendPush } from "../services/sendPush.js";
import { addExpenseSchema } from "../validations/expenseValidation.js";
import { getGroupNetBalance } from "../services/balanceService.js";

export const addExpense = async (req, res) => {
  try {
    const { title, totalAmount, splitType, groupId, paidBy, splits } =
      addExpenseSchema.parse(req.body);
    validateTotalPaidAmount(totalAmount, paidBy);
    const calculateSplits = calculateExpenseSplits(
      totalAmount,
      splits,
      splitType
    );
    const expense = await Expense.create({
      title,
      totalAmount,
      splitType,
      groupId,
      paidBy,
    });
    const groupMembers = await GroupMember.find({ groupId })
      .populate("memberId", "name fcmToken email")
      .lean();
    const group = await Group.findById(groupId).lean();

    const expenseSplitDoc = calculateSplits.map((s) => ({
      groupId,
      expenseId: expense._id,
      userId: s.userId,
      shareAmount: s.shareAmount,
    }));
    await ExpenseSplit.insertMany(expenseSplitDoc);
    const ledgerUpdates = calculateLedgerUpdates(
      paidBy,
      calculateSplits,
      groupId,
      expense._id
    );
    // for (let u of ledgerUpdates) {
    //   await applyBalanceUpdate(u);
    // }
    await refineLedgerEntries(ledgerUpdates);
    await redis.del(`group:summary:${groupId}`);
    await redis.del(`group:balance:${groupId}`);
    const job = await notificationQueue.add("expense-notification", {
      title: "New expense added",
      message: `${expense.title} was added in ${group.name} group`,
      entityType: "Expense",
      entityId: expense._id,
      members: groupMembers.map((m) => ({
        _id: m.memberId?._id,
        email: m.memberId.email,
        fcmToken: m.memberId.fcmToken,
      })),
    });

    return res
      .status(200)
      .json({ success: true, message: "Expense added successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const editExpense = async (req, res) => {
  try {
    const {
      title,
      totalAmount,
      splitType,
      groupId,
      paidBy,
      splits,
      expenseId,
    } = req.body;
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }
    validateTotalPaidAmount(totalAmount, paidBy);
    // const totalShareAmount = splits.reduce((sum, s) => sum + s.amount);
    const calculateSplits = calculateExpenseSplits(
      totalAmount,
      splits,
      splitType
    );
    expense.title = title;
    expense.totalAmount = totalAmount;
    expense.paidBy = paidBy;
    expense.splitType = splitType;
    await expense.save();

    const expenseSplitDoc = calculateSplits.map((s) => ({
      groupId,
      expenseId,
      userId: s.userId,
      shareAmount: s.shareAmount,
    }));

    const group = await Group.findById(groupId);
    const groupMembers = await GroupMember.find({ groupId }).populate(
      "memberId"
    );

    await ExpenseSplit.deleteMany({ expenseId, groupId });
    await ExpenseSplit.insertMany(expenseSplitDoc);

    const ledgerUpdates = calculateLedgerUpdates(
      paidBy,
      calculateSplits,
      groupId,
      expenseId
    );

    await Balance.deleteMany({ groupId, expenseId });
    await refineLedgerEntries(ledgerUpdates);

    await redis.del(`group:summary:${groupId}`);
    await redis.del(`group:balance:${groupId}`);
    const job = await notificationQueue.add("expense-updated", {
      members: groupMembers.map((m) => ({
        _id: m.memberId._id,
        email: m.memberId.email,
        fcmToken: m.memberId.fcmToken,
      })),
      title: "Expense updated",
      message: `${expense.title} is updated in ${group.name} group`,
      entityType: "Expense",
      entityId: expenseId,
    });

    // for (let member of groupMembers) {
    //   await ActivityLogs.create({
    //     userId: member?._id,
    //     action: `${expense.title} is updated in ${group.name} group`,
    //     entityType: "Expense",
    //     entityId: expenseId,
    //   });
    // }
    return res
      .status(200)
      .json({ success: true, message: "Expense updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.body;
    if (!expenseId) {
      return res
        .status(404)
        .json({ success: false, message: "Expense id required" });
    }
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }

    const groupMembers = await GroupMember.find({
      groupId: expense.groupId,
    }).populate("memberId groupId");
    await redis.del(`group:summary:${expense.groupId}`);
    await redis.del(`group:balance:${expense.groupId}`);
    await Expense.findByIdAndDelete(expenseId);
    await ExpenseSplit.deleteMany({ expenseId });
    await Balance.deleteMany({
      expenseId: expenseId,
      groupId: expense.groupId,
    });
    const logs = groupMembers.map((member) => ({
      userId: member?.memberId._id,
      action: `${expense.title} is deleted in ${member?.groupId?.name} group`,
      entityType: "Expense",
      entityId: expenseId,
    }));
    await ActivityLogs.insertMany(logs);
    return res
      .status(200)
      .json({ success: true, message: "Expense deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getGroupSummary = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!groupId) {
      return res
        .status(400)
        .json({ success: false, message: "Group ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Group ID format" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    const id = new mongoose.Types.ObjectId(groupId);
    const cacheKey = `group:summary:${groupId}`;
    const cacheData = await redis.get(cacheKey);
    if (cacheData) {
      return res.status(200).json({
        success: true,
        message: "Expense fetched successfully from cache data",
        expenses: JSON.parse(cacheData),
      });
    }
    const expenses = await Expense.aggregate([
      {
        $match: {
          groupId: new mongoose.Types.ObjectId(groupId),
        },
      },

      {
        $lookup: {
          from: "expensesplits",
          localField: "_id",
          foreignField: "expenseId",
          as: "expenseSplits",
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "expenseSplits.userId",
          foreignField: "_id",
          as: "users",
        },
      },

      {
        $addFields: {
          expenseSplits: {
            $map: {
              input: "$expenseSplits",
              as: "split",
              in: {
                shareAmount: "$$split.shareAmount",
                userId: "$$split.userId",
                name: {
                  $let: {
                    vars: {
                      user: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$users",
                              as: "u",
                              cond: { $eq: ["$$u._id", "$$split.userId"] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: "$$user.name",
                  },
                },
              },
            },
          },
        },
      },

      {
        $project: {
          users: 0,
          __v: 0,
        },
      },
    ]);
    if (expenses.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No expense available",
        expenses: [],
      });
    }
    await redis.set(cacheKey, JSON.stringify(expenses));
    return res.status(200).json({
      success: true,
      message: "Expense fetched successfully",
      expenses,
    });
  } catch (error) {
    console.log("getGroupSummary error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getGroupBalance = async (req, res) => {
  try {
    const { groupId } = req.params;
    if (!groupId) {
      return res
        .status(404)
        .json({ success: false, message: "Group id is required" });
    }
    const cacheKey = `group:balance:${groupId}`;
    const cacheData = await redis.get(cacheKey);
    if (cacheKey && cacheData !== null) {
      return res.status(200).json({
        success: true,
        message: "Balance data fetched from cache",
        data: JSON.parse(cacheData),
      });
    }
    const rows = await getGroupNetBalance(groupId);
    console.log("rows:", rows)
    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "balance data not found" });
    }
    await redis.set(cacheKey, JSON.stringify(rows));
    return res.status(200).json({
      success: true,
      message: "Balance data fetched successfully",
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
