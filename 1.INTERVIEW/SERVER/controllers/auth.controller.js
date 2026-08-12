import User from "../models/user.model.js";
import { gettoken } from "../config/token.js"


export const googleAuth = async (req, res) => {
  try {
    const {name,email}=req.body
    let user = await User.findOne({ email });
    if(!user){
      user = await User.create({name,email})
    }
    let token = await gettoken(user._id)
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    })
    res.status(200).json({ message: "User logged in successfully", user, token })
  }catch(error){
    console.error("Error in googleAuth:", error);
    res.status(500).json({ message: "Internal server error" });
  } 
    } 
export const logout = async (req, res) => {
  try {
    await res.clearCookie("token"); 
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error("Error in logout:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}






