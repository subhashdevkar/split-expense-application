import express from "express";
import { settlementPayment } from "../controllers/settlementController.js";

const settlementRouter = express.Router();

settlementRouter.post("/", settlementPayment);

export default settlementRouter;
