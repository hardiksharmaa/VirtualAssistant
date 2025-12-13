import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const groqResponse = async (command, assistantName, userName, history = []) => {
    try {
        const conversationHistory = history.map(msg => ({
            role: "user",
            content: msg
        }));

        const systemPrompt = `You are a virtual assistant named ${assistantName} created by ${userName}. 
        You will now behave like a voice-enabled assistant.
        
        Your task is to understand the user's natural language input and respond with a JSON object.
        
        JSON Structure:
        {
          "type": "general" | "google-search" | "youtube-search" | "youtube-play" | "get-time" | "get-date" | "get-day" | "get-month"|"calculator-open" | "instagram-open" |"facebook-open" |"weather-show",
          "userInput": "<original user input>",
          "response": "<a short spoken response>"
        }
        
        CRITICAL RULES FOR "type":
        1. "general": USE THIS FOR 95% OF QUESTIONS. If the user asks "What is Javascript?", "Who is Elon Musk?", "Tell me a joke", or "How are you?", use "general". ANSWER THE QUESTION YOURSELF in the "response" field.
        2. "google-search": ONLY use this if the user asks for *real-time* info (e.g., "current stock price", "news today", "weather") OR explicitly says "Search for...".
        3. "youtube-play": Use this if the user says "Play [song/video]".
        
        Context: The user has previously said: ${JSON.stringify(history)}. Use this to understand follow-up questions like "How old is he?".

        Current input: ${command}
        `;

        const messages = [
            { role: "system", content: systemPrompt },
            ...conversationHistory,
            { role: "user", content: command }
        ];

        const completion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.3-70b-versatile", 
            response_format: { type: "json_object" }
        });

        return completion.choices[0]?.message?.content || null;

    } catch (error) {
        console.error("Groq API Error:", error);
        return null;
    }
};

export default groqResponse;