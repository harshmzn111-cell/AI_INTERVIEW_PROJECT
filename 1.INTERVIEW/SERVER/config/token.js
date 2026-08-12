import jwt from "jsonwebtoken"
export const gettoken = async (userid) => {
  try {
    const token = jwt.sign({ userId: userid }, process.env.JWTSECRET, { expiresIn: "1d" });
    return token;
  } catch (error) {
    console.error("Error generating token:", error);
    throw error;
  }
}
