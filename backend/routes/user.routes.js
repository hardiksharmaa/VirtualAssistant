import express from "express"
import { askToAssistant, getCurrentUser, updateAssistant, getDeepgramToken } from "../controllers/user.controllers.js" 
import isAuth from "../middlewares/isAuth.js"
import upload from "../middlewares/multer.js"

const userRouter=express.Router()

userRouter.get("/current",isAuth,getCurrentUser)
userRouter.post("/update",isAuth,upload.single("assistantImage"),updateAssistant)
userRouter.post("/asktoassistant",isAuth,askToAssistant)
userRouter.get("/deepgram-token", isAuth, getDeepgramToken) 

export default userRouter