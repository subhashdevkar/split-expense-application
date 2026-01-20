import cron from "node-cron";
import Balance from "../models/balanceModel.js";
import transporter from "../configs/nodemailer.js";

export const sendPaymentReminders = async () => {
  try {
    cron.schedule("0 0 1 * *", async () => {
      const balances = await Balance.find({}).populate("fromUser toUser");
      for (let entry of balances) {
        const mailOption = {
          from: process.env.SENDER_EMAIL,
          to: entry?.fromUser?.email,
          subject: "Payment reminder",
          text: `You owe ${entry.balance} to ${entry?.toUser?.name}`,
        };
        console.log(mailOption);
        // await transporter.sendMail(mailOption);
        console.log("email send successfully");
      }
    });
  } catch (error) {
    console.log("cron job error:", error.message);
  }
};
