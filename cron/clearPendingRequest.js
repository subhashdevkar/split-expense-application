import cron from "node-cron";
import Friend from "../models/friendModel.js";

const clearPendingRequest = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      const expireTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      await Friend.deleteMany({
        status: "pending",
        createdAt: { $lt: expireTime },
      });
      console.log("Pending expired request deleted successfully");
    } catch (error) {
      console.log(error.message);
    }
  });
};
export default clearPendingRequest;
