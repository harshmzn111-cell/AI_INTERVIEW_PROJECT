
import { Route, Routes,  } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Auth from "./pages/Auth.jsx";
import InterviewPage from "./pages/InterviewPage.jsx";
import InterviewHistory from "./pages/InterviewHistory.jsx";
import Pricing from "./pages/Pricing.jsx";
import InterviewReport from "./pages/InterviewReport.jsx";
import axios from "axios";

import { useEffect } from "react";
axios.defaults.withCredentials = true;
export const serverUrl = "https://ai-interview-project-server.onrender.com";
import { useDispatch } from "react-redux";
import { setUserData } from "./redux/userSlice.js";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const getUser = async () => {
      try {
        const result = await axios.get(serverUrl + "/api/user/current-user", { withCredentials: true });
        dispatch(setUserData(result.data.user));
        console.log("current user api ",result.data)
      } catch (error) {
        console.log(error);
        dispatch(setUserData(null));
      }
    };
    getUser();
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/home" element={<Home />} />
      <Route path="/interview" element={<InterviewPage />} />
      <Route path="/history" element={<InterviewHistory/>}/>
       <Route path="/Pricing" element={<Pricing/>}/>
 <Route path="/Report/:id" element={<InterviewReport/>}/>
    </Routes>
  );
}

export default App
