import jwt from "jsonwebtoken";
export const isAuth = async (req, res, next) => {
  try {
    const tokenData = req.headers.authorization;
    const token = tokenData?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "You are not authorized" });
    }
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);
    req.user = tokenDecode;
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
