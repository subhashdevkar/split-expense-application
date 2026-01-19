import Stripe from "stripe";
import Settlement from "../models/settlementModel.js";
import Balance from "../models/balanceModel.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export const createPaymentIntent = async (req, res) => {
  try {
    const { groupId, fromUser, toUser, amount, method, note } = req.body;
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

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "inr",
      metadata: {
        groupId,
        fromUser,
        toUser,
      },
    });
    return res.status(200).json({
      success: true,
      message: "Payment intent created successfully",
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const stripeWebHookHandler = async (req, res) => {
  try {
    const { data } = req.body;
    if (data.object.status === "succeeded") {
      const session = data.object;
      const { groupId, fromUser, toUser } = session.metadata;

      const amountPaid = session.amount / 100;
      await Settlement.create({
        groupId,
        payer: fromUser,
        receiver: toUser,
        amount: amountPaid,
        method: "stripe",
        note: "stripe payment online",
        stripePaymentId: session.id,
      });
      await Balance.deleteMany({
        $or: [
          { fromUser: fromUser, toUser: toUser },
          { fromUser: toUser, toUser: fromUser },
        ],
      });
      return res
        .status(200)
        .json({ success: true, message: "Payment successfully paid" });
    }
    return res
      .status(404)
      .json({ success: false, message: "something went wrong" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
