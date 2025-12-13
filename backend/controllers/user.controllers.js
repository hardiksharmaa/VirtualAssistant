import groqResponse from "../groq.js"; 
import User from "../models/user.model.js";
import moment from "moment";

export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(400).json({ message: "user not found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        return res.status(400).json({ message: "get current user error" });
    }
};

export const updateAssistant = async (req, res) => {
    try {
        const { assistantName, imageUrl } = req.body;
        let assistantImage = imageUrl; 

        const user = await User.findByIdAndUpdate(req.userId, {
            assistantName, assistantImage
        }, { new: true }).select("-password");
        return res.status(200).json(user);
    } catch (error) {
        return res.status(400).json({ message: "updateAssistantError user error" });
    }
};

export const askToAssistant = async (req, res) => {
    try {
        const { command } = req.body;

        const user = await User.findById(req.userId);
        
        // --- NEW: Grab the last 5 messages for Context Memory ---
        // We assume history is an array of strings. We take the last 5.
        const recentHistory = user.history.slice(-5);
        
        user.history.push(command);
        await user.save();

        const userName = user.name;
        const assistantName = user.assistantName;

        // --- UPDATED: Pass history to Groq ---
        const result = await groqResponse(command, assistantName, userName, recentHistory);

        if (!result) {
            return res.status(500).json({ response: "I'm having trouble thinking properly right now." });
        }

        let gemResult;
        try {
            gemResult = JSON.parse(result);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            return res.status(500).json({ response: "I am confused." });
        }

        const type = gemResult.type;

        switch (type) {
            case 'get-date':
                return res.json({
                    type,
                    userInput: gemResult.userInput,
                    response: `current date is ${moment().format("YYYY-MM-DD")}`
                });
            case 'get-time':
                return res.json({
                    type,
                    userInput: gemResult.userInput,
                    response: `current time is ${moment().format("hh:mm A")}`
                });
            case 'get-day':
                return res.json({
                    type,
                    userInput: gemResult.userInput,
                    response: `today is ${moment().format("dddd")}`
                });
            case 'get-month':
                return res.json({
                    type,
                    userInput: gemResult.userInput,
                    response: `today is ${moment().format("MMMM")}`
                });
            case 'google-search':
            case 'youtube-search':
            case 'youtube-play':
            case 'general':
            case "calculator-open":
            case "instagram-open":
            case "facebook-open":
            case "weather-show":
                return res.json({
                    type,
                    userInput: gemResult.userInput,
                    response: gemResult.response,
                });

            default:
                return res.status(400).json({ response: "I didn't understand that command." });
        }

    } catch (error) {
        console.error("Ask assistant error:", error);
        return res.status(500).json({ response: "ask assistant error" });
    }
}

export const getDeepgramToken = async (req, res) => {
    try {
        const apiKey = process.env.DEEPGRAM_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ message: "Missing Deepgram API Key" });
        }
        return res.json({ key: apiKey });
    } catch (error) {
        return res.status(500).json({ message: "Deepgram error" });
    }
};