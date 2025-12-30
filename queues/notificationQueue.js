import { Queue } from "bullmq";
import redis from "../configs/redis.js";

const notificationQueue = new Queue("notification-queue", {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export default notificationQueue;
