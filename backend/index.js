import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

// 1. UPDATE CORS to allow ANY origin (easiest for deployment) 
// or specify your frontend url later
app.use(cors({
    origin: true, // This allows requests from your Vercel frontend
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// 2. Connect to DB *outside* the listen function for Vercel
connectDb(); 

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

app.get("/", (req, res) => {
    res.send("Hello from Jarvis Backend");
});

const port = process.env.PORT || 5000;

// 3. Only listen to port if NOT in production (Vercel handles the port automatically)
if (process.env.NODE_ENV !== "production") {
    app.listen(port, () => {
        console.log(`Server started on port ${port}`);
    });
}

// 4. EXPORT the app for Vercel
export default app;