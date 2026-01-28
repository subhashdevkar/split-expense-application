import express from "express";
import { settlementPayment } from "../controllers/settlementController.js";
import { isAuth } from "../middlewares/isAuth.js";

const settlementRouter = express.Router();

settlementRouter.post("/", isAuth, settlementPayment);

export default settlementRouter;
