import { Worker } from "bullmq";
import transporter from "../configs/nodemailer.js";
import ActivityLogs from "../models/activityLogsModel.js";
import Notification from "../models/notificationModel.js";
import { sendPush } from "../services/sendPush.js";
import redis from "../configs/redis.js";

const worker = new Worker(
  "notification-queue",
  async (job) => {
    console.log("Worker picked job:", job.id, job.name, job.data);
    if (job.name === "expense-notification" || job.name === "expense-updated") {
      const { members, title, message, entityType, entityId } = job.data;
      await processGroupNotification(members, {
        title,
        message,
        entityType,
        entityId,
      });
    }
    if (job.name === "settlement-received") {
      const { receiver, payer, amount, settlementId } = job.data;
      const title = "Settlement Received";
      const message = `${payer.name} has paid you ${amount}`;

      await Notification.create({
        userId: receiver._id,
        title,
        description: message,
      });

      // if (receiver.email) {
      //   await transporter.sendMail({
      //     from: process.env.SENDER_EMAIL,
      //     to: receiver.email,
      //     subject: title,
      //     text: message,
      //   });
      // }
      await ActivityLogs.create({
        userId: receiver._id,
        action: message,
        entityType: "Settlement",
        entityId: settlementId,
      });
      if (receiver.fcmToken) {
        await sendPush(receiver.fcmToken, title, message);
      }
    }
  },
  { connection: redis, concurrency: 5 }
);

worker.on("failed", (job, err) => {
  console.log("notification job failed:", job?.id, err);
});
worker.on("completed", (job) => {
  console.log("Notification job completed:", job?.id);
});

const processGroupNotification = async (
  members,
  { title, message, entityType, entityId }
) => {
  const notifications = [];
  const activityLogs = [];
  const emailPromises = [];
  const pushPromises = [];

  members.forEach(async (member) => {
    notifications.push({
      userId: member._id,
      title,
      description: message,
    });

    activityLogs.push({
      userId: member._id,
      action: message,
      entityType,
      entityId,
    });
    // if (member.email) {
    //   emailPromises.push(
    //     transporter.sendMail({
    //       from: process.env.SENDER_EMAIL,
    //       to: member.email,
    //       subject: title,
    //       html: `<h3>${title}</h3><p>${message}</p>`,
    //       text: message,
    //     })
    //   );
    // }
    if (member.fcmToken) {
      pushPromises.push(sendPush(member.fcmToken, title, message));
    }
    await Promise.allSettled([...emailPromises, ...pushPromises]);
    if (notifications.length > 0) {
      await Notification.insertMany(notifications, { ordered: false });
    }
    if (activityLogs.length > 0) {
      await ActivityLogs.insertMany(activityLogs, { ordered: false });
    }
  });
};
