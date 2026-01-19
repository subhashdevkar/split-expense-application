import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import transporter from "../configs/nodemailer.js";
import {
  generateOtp,
  sendOtpEmail,
  verifyOtp,
} from "../services/authService.js";

export const register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res
        .status(409)
        .json({ success: false, message: "User already exist" });
    }
    const hash = await bcrypt.hash(password, 12);
    await User.create({ name, email, password: hash, phone });
    return res
      .status(201)
      .json({ success: true, message: "User created successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { loginId, password } = req.body;
    const user = await User.findOne({
      $or: [{ email: loginId }, { phone: loginId }],
    });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Incorrect password" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    return res
      .status(200)
      .json({ success: true, message: "Login successfully", token });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const sendResetPasswordOtp = async (req, res) => {
  try {
    const { loginId } = req.body;

    const user = await User.findOne({
      $or: [{ email: loginId }, { phone: loginId }],
    });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiredAt = Date.now() + 10 * 60 * 1000;
    await user.save();
    await sendOtpEmail(user, otp, "Reset password Otp");
    return res.status(200).json({
      success: true,
      message: "Reset password otp sent on email successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { loginId, otp, newPassword } = req.body;
    const user = await User.findOne({
      $or: [{ email: loginId }, { phone: loginId }],
    });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const isValid = await verifyOtp(user, otp, "otp", "otpExpiredAt", res);
    if (isValid !== true) {
      return isValid;
    }
    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    user.otp = "";
    user.otpExpiredAt = 0;
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Password successfully changed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const sendVerifyOtp = async (req, res) => {
  try {
    const { loginId } = req.body;
    // Match user by either email or phone (same as login/reset-password flows)
    const user = await User.findOne({ email: loginId });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    const otp = generateOtp();
    user.verifyOtp = otp;
    user.verifyOtpExpiredAt = Date.now() + 10 * 60 * 1000;
    await user.save();
    await sendOtpEmail(user, otp, "verify Email Otp");
    return res
      .status(200)
      .json({ success: true, message: "Verify email otp sent successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found with the email id" });
    }
    const isValid = await verifyOtp(
      user,
      otp,
      "verifyOtp",
      "verifyOtpExpiredAt",
      res
    );
    if (isValid !== true) {
      return isValid;
    }
    user.verifyOtp = "";
    user.verifyOtpExpiredAt = 0;
    user.verifiedEmail = true;
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
