import User from "../models/userModel.js";

// export const updateUserProfile = async (req, res) => {
//   try {
//     const
//   } catch (error) {
// return res.status(500).json({ success: false, message: error.message });
//   }
// };

export const findUser = async (req, res) => {
  try {
    console.log("req.query", req.query);
    const { searchTerm } = req.body;
    const loggedInUser = req.user.id;
    if (!searchTerm) {
      return res
        .status(404)
        .json({ success: false, message: "Search term is required" });
    }
    const regex = new RegExp(searchTerm, "i");
    const users = await User.find({
      _id: { $ne: loggedInUser },
      $or: [{ email: regex }, { phone: regex }, { name: regex }],
    });
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "No user found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Users fetched successfully", users });
  } catch (error) {
    console.log("find user error", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
