import express from "express";
import cors from "cors";
import "dotenv/config";
// import "./configs/redis.js";
import connectDb from "./configs/mongoose.js";
import authRouter from "./routes/authRouter.js";
import userRouter from "./routes/userRouter.js";
import friendRouter from "./routes/friendRouter.js";
import clearPendingRequest from "./cron/clearPendingRequest.js";
``;
import groupRouter from "./routes/groupRouter.js";
import groupMemberRouter from "./routes/groupMemberRouter.js";
import expenseRouter from "./routes/expenseRouter.js";
import settlementRouter from "./routes/settlementRouter.js";
import notificationRouter from "./routes/notificationRouter.js";
import paymentRouter from "./routes/paymentRouter.js";
import { sendPaymentReminders } from "./cron/sendPaymentReminder.js";
import activityLogsRouter from "./routes/activityLogsRouter.js";
import expenseSplitRouter from "./routes/expenseSplitRouter.js";
import "./queues/notificationWorker.js";
const app = express();
const port = process.env.PORT || 4000;
app.use(cors());
app.use(express.json());
connectDb();
clearPendingRequest();
sendPaymentReminders();
app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/friend", friendRouter);
app.use("/group", groupRouter);
app.use("/group-member", groupMemberRouter);
app.use("/expense", expenseRouter);
app.use("/expense-splits", expenseSplitRouter);
app.use("/settlement", settlementRouter);
app.use("/payment", paymentRouter);
app.use("/notification", notificationRouter);
app.use("/activity-logs", activityLogsRouter);
app.use("/", (req, res) => {
  res.send("api is working");
});

app.listen(port, () =>
  console.log(`server is started:http://localhost:${port}`)
);
