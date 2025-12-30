import z from "zod";

export const addExpenseSchema = z.object({
  title: z.string(),
  totalAmount: z.number(),
  splitType: z.enum(["equal", "exact", "percentage", "share"]),
  paidBy: z.array(
    z.object({
      userId: z.string(),
      amount: z.number(),
    })
  ),
  groupId: z.string(),
  splits: z.array(
    z.object({
      userId: z.string(),
      amount: z.number().optional(),
      percentage: z.number().optional(),
      share: z.number().optional(),
    })
  ),
  expenseId: z.string().optional(),
});
