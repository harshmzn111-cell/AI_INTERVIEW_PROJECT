import jwt from "jsonwebtoken"
const isauth =async (req,res,next)=>{
  try {
    let {token} =req.cookies

    if(!token){
      return  res.status(400).json({message:"user does not have token"})

    }
    const verifyToken =jwt.verify(token,process.env.JWTSECRET)
    if(!verifyToken){
      return res.status(400).json({message: "user does not have any valid token"})

    }
    req.userId = verifyToken.userId
    next()

  }catch(error){
    return res.status(500).json({message:"internal server error"})
  }

}
export default isauth