import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    phone: { type: String, unique: true, required: true },
    otp: { type: String },
    otpExpiredAt: { type: Number, default: 0 },
    verifyOtp: { type: String },
    verifyOtpExpiredAt: { type: Number, default: 0 },
    verifiedEmail: { type: Boolean, default: false },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    fcmToken: { type: String, default: null },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
