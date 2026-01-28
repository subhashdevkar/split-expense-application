import express from "express";
import { sendPaymentReminder } from "../controllers/paymentController.js";
import { isAuth } from "../middlewares/isAuth.js";

const paymentRouter = express.Router();

paymentRouter.post("/", isAuth, sendPaymentReminder);

export default paymentRouter;
