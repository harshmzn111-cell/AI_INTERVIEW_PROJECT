import { createSlice } from '@reduxjs/toolkit'

 const userSlice = createSlice({
  name: 'user',
  initialState: {
   userData: null,
   interviewData:null,
  },
  reducers:{
    setUserData:(state,action)=>{
      state.userData=action.payload
    },
    setInterviewData: (state,action)=>{
      state.interviewData=action.payload
    }

  } 
})
export const {setUserData,setInterviewData}=userSlice.actions
export default userSlice.reducer;