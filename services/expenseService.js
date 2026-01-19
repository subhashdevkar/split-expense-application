import Balance from "../models/balanceModel.js";

export const calculateExpenseSplits = (totalAmount, splits, splitType) => {
  if (splitType === "equal") {
    const splitAmount = totalAmount / splits?.length;
    return splits.map((s) => ({
      userId: s.userId,
      shareAmount: splitAmount,
    }));
  }
  if (splitType === "exact") {
    const totalExactAmount = splits.reduce((sum, s) => sum + s.amount, 0);
    if (totalExactAmount !== totalAmount) {
      throw new Error("Total amount and exact amount should be same");
    }
    return splits.map((s) => ({
      userId: s.userId,
      shareAmount: s.amount,
    }));
  }
  if (splitType === "percentage") {
    const totalPercentage = splits.reduce((sum, s) => sum + s.percentage, 0);
    if (totalPercentage !== 100) {
      throw new Error("Total percentage should be 100");
    }
    return splits.map((s) => ({
      userId: s.userId,
      shareAmount: (totalAmount * s.percentage) / 100,
    }));
  }
  if (splitType === "share") {
    const totalShare = splits.reduce((sum, s) => sum + s.share, 0);
    return splits.map((s) => ({
      userId: s.userId,
      shareAmount: (totalAmount * s.share) / totalShare,
    }));
  }
  throw new Error("Invalid split type");
};

export const validateTotalPaidAmount = (totalAmount, paidBy) => {
  const totalPaidAmount = paidBy.reduce((sum, p) => sum + p.amount, 0);
  if (totalPaidAmount !== totalAmount) {
    throw new Error(
      "Total paid amount does not match the total expense amount."
    );
  }
};

export const calculateLedgerUpdates = (paidBy, splits, groupId, expenseId) => {
  const updates = [];
  const totalSplitAmount = splits.reduce((sum, s) => sum + s.shareAmount, 0);
  for (let split of splits) {
    for (let payer of paidBy) {
      if (payer.userId.toString() === split.userId.toString()) {
        continue;
      }
      const payerContributionRatio = payer.amount / totalSplitAmount;

      const owedAmount = split.shareAmount * payerContributionRatio;
      updates.push({
        groupId,
        expenseId,
        fromUser: split.userId,
        toUser: payer.userId,
        amount: owedAmount,
      });
    }
  }
  return updates;
};
export const refineLedgerEntries = async (transactions) => {
  const pairMap = transactions.reduce((acc, t) => {
    const { groupId, expenseId, fromUser, toUser, amount } = t;
    const [a, b] = fromUser < toUser ? [fromUser, toUser] : [toUser, fromUser];
    const key = `${a}|${b}`;
    if (!acc[key]) {
      acc[key] = { groupId, expenseId, a, b, net: 0 };
    }
    const sign = fromUser === a ? 1 : -1;
    acc[key].net += sign * amount;

    return acc;
  }, {});
  const simplified = Object.values(pairMap)
    .filter((p) => Math.abs(p.net) > 1e-9)
    .map((p) => ({
      groupId: p.groupId,
      expenseId: p.expenseId,
      fromUser: p.net > 0 ? p.a : p.b,
      toUser: p.net > 0 ? p.b : p.a,
      balance: Math.abs(p.net),
    }));
  if (simplified.length === 0) {
    throw new Error("balance entries can not be 0");
  }
  await Balance.insertMany(simplified);
};
export const applyBalanceUpdate = async (update) => {
  const { groupId, expenseId, fromUser, toUser, amount } = update;
  const reverse = await Balance.findOne({
    groupId,
    fromUser: toUser,
    toUser: fromUser,
  });
  if (reverse) {
    if (reverse.balance > amount) {
      reverse.balance -= amount;
      await reverse.save();
      return;
    } else if (reverse.balance < amount) {
      const newAmount = amount - reverse.balance;
      await reverse.deleteOne();
      await Balance.create({
        groupId,
        fromUser,
        toUser,
        balance: newAmount,
      });
      return;
    } else {
      await reverse.deleteOne();
      return;
    }
  }

  const existing = await Balance.findOne({ groupId, fromUser, toUser });
  if (existing) {
    existing.balance += amount;
    await existing.save();
  } else {
    await Balance.create({
      groupId,
      fromUser,
      toUser,
      balance: amount,
    });
  }
};
