import ExpenseSplit from "../models/expenseSplitModel.js";

export const getExpenseSplits = async (req, res) => {
  try {
    const { expenseId } = req.params;
    if (!expenseId) {
      return res
        .status(404)
        .json({ success: false, message: "Expense id is required" });
    }
    const expenseSplits = await ExpenseSplit.find({ expenseId })
      .populate("userId", "name email")
      .lean();
    if (expenseSplits.length === 0) {
      return res
        .status(200)
        .json({ success: true, message: "No expense splits found" });
    }
    return res.status(200).json({
      success: true,
      message: "Expense splits fetched successfully",
      expenseSplits,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
