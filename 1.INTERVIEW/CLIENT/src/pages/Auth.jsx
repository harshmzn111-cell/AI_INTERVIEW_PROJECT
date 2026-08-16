import axios from "axios";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice.js";
import { BsRobot } from "react-icons/bs"
import { IoSparkles } from "react-icons/io5"
import { FcGoogle } from "react-icons/fc"
import { motion } from "motion/react"
import { auth, provider } from "../utils/firebase"
import { signInWithPopup } from "firebase/auth"

const serverUrl = "https://ai-interview-project-server.onrender.com";
function Auth({isModel=false}) {
const dispatch = useDispatch();
  
const handleGoogleSignIn = async () => {
  
  try {
    const response = await signInWithPopup(auth, provider);
      let user = response.user;
      let name = user.displayName;
      let email = user.email;
      const result =await axios.post(serverUrl+"/api/auth/google",{name,email},{withCredentials:true});
      console.log("Google sign-in successful:", result.data);
      dispatch(setUserData(result.data));
  } catch (error) {
    console.error("Error during Google sign-in:", error);
    dispatch(setUserData(null));
  }
};


  return (
    <div
  className={`w-full ${
    isModel
      ? "py-4"
      : "min-h-screen bg-[#f3f3f3] flex items-center justify-center px-6 py-20"
  }`}
>
  
      <motion.div
        className={`w-full ${
    isModel
      ? "max-w-md p-8 rounded-3xl"
      : "max-w-lg p-12 rounded-[32px]"
  } bg-white shadow-2xl border border-gray-200`}
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className='flex items-center justify-center gap-3 mb-6'>
          <div className='bg-black text-white p-2 rounded-lg'>
            <BsRobot size={18} />
          </div>
          <h2 className='text-xl font-semibold'>IntelliHireIQ.AI</h2>
        </div>
        <h1 className='text-2xl md:text-3xl font-semibold text-center leading-snug mb-4'>
          continue with
          <span className='bg-green-100 text-green-600 px-3 py-1 rounded-full inline-flex items-center gap-2'>
            <IoSparkles size={16}/>
            AI Smart Interview
          </span>
        </h1>
        <p className='text-gray-500 text-center text-sm md:text-base leading-relaxed mb-8'>
          Sign in to start AI powered interview preparation and get personalized feedback to improve your skills.
        </p>
        <motion.button
        onClick={handleGoogleSignIn}
          whileHover={{ opacity: 0.7, scale: 1.03 }}
          whileTap={{ opacity: 0.7, scale: 0.98 }}
          className='w-full flex items-center justify-center gap-3 py-3 bg-black text-white rounded-full shadow-md'
        >
          <FcGoogle size={20} />
          Continue with Google
        </motion.button>
      </motion.div>
    </div>
  )
}

export default Auth
