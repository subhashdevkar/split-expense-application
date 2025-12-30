import transporter from "../configs/nodemailer.js";

export const sendOtpEmail = async (user, otp, subject) => {
  const mailOption = {
    from: process.env.SENDER_EMAIL,
    to: user.email,
    subject: subject,
    html: `
      <h2>Your ${subject} OTP</h2>
      <p><strong>${otp}</strong></p>
      <p>Expires in 10 minutes</p>
    `,
    text: `Your ${subject} OTP is ${otp} and expires in 10 min`,
  };
  await transporter.sendMail(mailOption);
};

export const generateOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000));

export const verifyOtp = async (user, otp, otpField, expiredAtField, res) => {
  if (otp !== user[otpField]) {
    return res.status(409).json({ success: false, message: "Invalid OTP" });
  }
  if (Date.now() > user[expiredAtField]) {
    user[otpField] = "";
    user[expiredAtField] = 0;
    await user.save();
    return res.status(410).json({ success: false, message: "OTP expired" });
  }
  return true;
};
