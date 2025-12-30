import express from "express";
import { sendPaymentReminder } from "../controllers/paymentController.js";

const paymentRouter = express.Router();

paymentRouter.post("/", sendPaymentReminder);

export default paymentRouter;
