import express from "express";
import validate from "../middlewares/validation.js";
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  sendOtpSchema,
  verifyEmailSchema,
} from "../validations/authValidations.js";
import {
  login,
  register,
  resetPassword,
  sendResetPasswordOtp,
  sendVerifyOtp,
  verifyEmail,
} from "../controllers/authController.js";

const authRouter = express.Router();

authRouter.post("/register", validate(registerSchema), register);
authRouter.post("/login", validate(loginSchema), login);
authRouter.post(
  "/reset-password/send-otp",
  validate(sendOtpSchema),
  sendResetPasswordOtp
);
authRouter.post(
  "/reset-password",
  validate(resetPasswordSchema),
  resetPassword
);
authRouter.post("/email/send-otp", validate(sendOtpSchema), sendVerifyOtp);
authRouter.post("/email/verify-otp", validate(verifyEmailSchema), verifyEmail);

export default authRouter;
