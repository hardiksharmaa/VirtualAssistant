import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const groqResponse = async (command, assistantName, userName) => {
    try {
        const prompt = `You are a virtual assistant named ${assistantName} created by ${userName}. 
        You will now behave like a voice-enabled assistant.
        
        Your task is to understand the user's natural language input and respond with a JSON object like this:
        
        {
          "type": "general" | "google-search" | "youtube-search" | "youtube-play" | "get-time" | "get-date" | "get-day" | "get-month"|"calculator-open" | "instagram-open" |"facebook-open" |"weather-show",
          "userInput": "<original user input>",
          "response": "<a short spoken response>"
        }
        
        Instructions:
        - Respond ONLY with the JSON object. Do not add markdown like \`\`\`json.
        - "type": determine the intent of the user.
        - "response": A short, conversational voice-friendly reply.
        
        now your userInput- ${command}`;

        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that outputs only valid JSON."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            // FIX: Updated to the currently active model
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