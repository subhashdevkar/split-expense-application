import Balance from "../models/balanceModel.js";

export const calculateExpenseSplits = (totalAmount, splits, splitType) => {
  console.log("splitType", splitType);
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
  // console.log("totalSplitAmount:", paidBy, splits, groupId, expenseId);
  for (let split of splits) {
    for (let payer of paidBy) {
      if (payer.userId.toString() === split.userId.toString()) {
        continue;
      }
      const payerContributionRatio = payer.amount / totalSplitAmount;

      const owedAmount = split.shareAmount * payerContributionRatio;
      // console.log(
      //   "owedAmount:",
      //   payer.amount,
      //   splits.reduce((sum, s) => sum + s, 0)
      // );
      updates.push({
        groupId,
        expenseId,
        fromUser: split.userId,
        toUser: payer.userId,
        amount: owedAmount,
      });
    }
  }
  // console.log("updates:", updates);
  return updates;
};
export const refineLedgerEntries = async (transactions) => {
  // const { groupId, expenseId, fromUser, toUser, amount } = entries;
  // console.log("transactions:", transactions);
  // for (let entry of entries) {
  //   for (let obj of entries) {
  //     if (entry === obj) {
  //       continue;
  //     }
  //     const reverseObj = {
  //       fromUser: obj.toUser,
  //       toUser: obj.fromUser,
  //       amount: obj.amount,
  //     };
  //     if (
  //       reverseObj.fromUser === entry.toUser &&
  //       reverseObj.toUser === entry.fromUser
  //     ) {
  //       if (reverseObj.amount > entry.amount) {
  //         reverseObj.amount -= entry.amount;
  //         refineEntries.push(reverseObj);
  //       } else if (reverseObj.amount < entry.amount) {
  //         entry.amount -= reverseObj.amount;
  //         refineEntries.push(entry);
  //       }
  //     }
  //   }
  // }
  // const ledger = new Map();
  // for (const tx of transactions) {
  //   const from = tx.fromUser.toString();
  //   const to = tx.toUser.toString();
  //   const groupId = tx.groupId.toString();
  //   const expenseId = tx.expenseId.toString();

  //   const pair = [from, to].sort();
  //   const key = pair.join("_");
  //   console.log(key);
  //   if (!ledger.has(key)) {
  //     ledger.set(key, {
  //       user1: pair[0],
  //       user2: pair[1],
  //       balance: 0,
  //       groupId,
  //       expenseId,
  //     });
  //   }
  //   const entry = ledger.get(key);
  //   if (from === entry.user1) {
  //     entry.balance += tx.amount;
  //   } else {
  //     entry.balance -= tx.amount;
  //   }
  // }
  // const refineEntries = [];
  // for (const entry of ledger.values()) {
  //   if (entry.balance === 0) {
  //     continue;
  //   }
  //   refineEntries.push(
  //     entry.balance > 0
  //       ? {
  //           groupId: entry.groupId,
  //           expenseId: entry.expenseId,
  //           fromUser: entry.user1,
  //           toUser: entry.user2,
  //           amount: entry.balance,
  //         }
  //       : {
  //           groupId: entry.groupId,
  //           expenseId: entry.expenseId,
  //           fromUser: entry.user2,
  //           toUser: entry.user1,
  //           amount: Math.abs(entry.balance),
  //         }
  //   );
  //   console.log("refineEntries:", refineEntries);
  //   await Balance.insertMany(refineEntries);
  // }
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
  console.log("i m running ");
  const simplified = Object.values(pairMap)
    .filter((p) => Math.abs(p.net) > 1e-9)
    .map((p) => ({
      groupId: p.groupId,
      expenseId: p.expenseId,
      fromUser: p.net > 0 ? p.a : p.b,
      toUser: p.net > 0 ? p.b : p.a,
      balance: Math.abs(p.net),
    }));
  console.log("simplified:", simplified);
  if (simplified.length === 0) {
    throw new Error("balance entries can not be 0");
  }
  await Balance.insertMany(simplified);
};
export const applyBalanceUpdate = async (update) => {
  const { groupId, expenseId, fromUser, toUser, amount } = update;
  // console.log(
  //   "applyBalanceUpdate",
  //   groupId,
  //   expenseId,
  //   fromUser,
  //   toUser,
  //   amount
  // );

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
    console.log("balance added successfully");
  }
};
