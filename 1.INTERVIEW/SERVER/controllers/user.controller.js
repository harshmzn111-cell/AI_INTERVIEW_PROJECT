
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const getcurrentUser = async (req, res) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(200).json({ user: null });
    }

    const verified = jwt.verify(token, process.env.JWTSECRET);
    if (!verified || !verified.userId) {
      return res.status(200).json({ user: null });
    }

    const user = await User.findById(verified.userId);
    if (!user) {
      return res.status(200).json({ user: null });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Error in getcurrentUser:", error);
    return res.status(200).json({ user: null });
  }
}