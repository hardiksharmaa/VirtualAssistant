import React, { useContext, useEffect, useRef, useState } from 'react'
import { userDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import aiImg from "../assets/ai.gif"
import { CgMenuRight } from "react-icons/cg";
import { RxCross1 } from "react-icons/rx";
import userImg from "../assets/user.gif"
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

function Home() {
  const { userData, serverUrl, setUserData, getGeminiResponse } = useContext(userDataContext)
  const navigate = useNavigate()
  
  const [listening, setListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false) 
  const [userText, setUserText] = useState("")
  const [aiText, setAiText] = useState("")
  const [ham, setHam] = useState(false)
  const [status, setStatus] = useState("Click anywhere to start...") 
  
  const deepgramRef = useRef(null)
  const microphoneRef = useRef(null)
  const isAssistantSpeaking = useRef(false) 

  const speak = async (text) => {
    try {
      if (!text) return;
      
      isAssistantSpeaking.current = true; 
      
      const response = await axios.get(`${serverUrl}/api/user/deepgram-token`, { withCredentials: true });
      const apiKey = response.data.key;

      const ttsResponse = await fetch(`https://api.deepgram.com/v1/speak?model=aura-asteria-en`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });

      const audioBlob = await ttsResponse.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      setIsSpeaking(true); 
      audio.play();

      audio.onended = () => {
        setAiText(""); 
        isAssistantSpeaking.current = false; 
        setIsSpeaking(false); 
      };

    } catch (error) {
      console.error("TTS Error:", error);
      isAssistantSpeaking.current = false;
      setIsSpeaking(false);
    }
  };

  const handleCommand = (data) => {
    const { type, userInput, response } = data
    speak(response);

    if (type === 'google-search') {
      window.open(`https://www.google.com/search?q=${encodeURIComponent(userInput)}`, '_blank');
    }
    if (type === 'calculator-open') {
      window.open(`https://www.google.com/search?q=calculator`, '_blank');
    }
     if (type === "instagram-open") {
      window.open(`https://www.instagram.com/`, '_blank');
    }
    if (type ==="facebook-open") {
      window.open(`https://www.facebook.com/`, '_blank');
    }
     if (type ==="weather-show") {
      window.open(`https://www.google.com/search?q=weather`, '_blank');
    }
    if (type === 'youtube-search' || type === 'youtube-play') {
      const query = encodeURIComponent(userInput);
      window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank');
    }
  }

  const startDeepgram = async () => {
    if (listening) return; 

    try {
      setListening(true);
      setStatus("Online & Listening...");
      
      const keyRes = await axios.get(`${serverUrl}/api/user/deepgram-token`, { withCredentials: true });
      const apiKey = keyRes.data.key;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneRef.current = new MediaRecorder(stream);
      
      const deepgram = createClient(apiKey);
      const connection = deepgram.listen.live({
        model: "nova-2",
        language: "en-US",
        smart_format: true,
        endpointing: 300,
      });

      connection.on(LiveTranscriptionEvents.Open, () => {
        connection.on(LiveTranscriptionEvents.Transcript, async (data) => {
          const transcript = data.channel.alternatives[0].transcript;
          
          if (transcript && data.is_final && !isAssistantSpeaking.current) {
            
            const triggerWord = userData?.assistantName?.toLowerCase() || "jarvis";
            const cleanTranscript = transcript.toLowerCase();

            if (cleanTranscript.includes(triggerWord)) {
                setUserText(transcript);
                
                const aiData = await getGeminiResponse(transcript);
                
                if (aiData) {
                  setAiText(aiData.response);
                  handleCommand(aiData);
                } else {
                  const errorMsg = "I'm having trouble connecting to the server.";
                  setAiText(errorMsg);
                  speak(errorMsg);
                }
            } else {
                console.log("Ignored (No Wake Word):", transcript);
            }
          }
        });
        
        microphoneRef.current.ondataavailable = (event) => {
          if (event.data.size > 0 && connection.getReadyState() === 1) {
            connection.send(event.data);
          }
        };
        microphoneRef.current.start(100);
      });

      deepgramRef.current = connection;
      
    } catch (error) {
      console.error("Deepgram Start Error:", error);
      setListening(false);
      setStatus("Error starting microphone");
    }
  };

  const stopDeepgram = () => {
    if (microphoneRef.current && microphoneRef.current.state !== "inactive") {
      microphoneRef.current.stop();
    }
    if (deepgramRef.current) {
      deepgramRef.current.finish();
      deepgramRef.current = null;
    }
    setListening(false);
    setStatus("Offline");
  };

  useEffect(() => {
    const handleInitialInteraction = () => {
        if (!listening) {
            startDeepgram();
            speak(`Hello ${userData.name}, I am online.`);
        }
        window.removeEventListener('click', handleInitialInteraction);
    };

    window.addEventListener('click', handleInitialInteraction);

    return () => {
        stopDeepgram();
        window.removeEventListener('click', handleInitialInteraction);
    };
  }, []);

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true })
      setUserData(null)
      navigate("/signin")
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className='w-full h-[100vh] bg-gradient-to-t from-[black] to-[#02023d] flex justify-center items-center flex-col gap-[15px] overflow-hidden cursor-pointer'>
      <CgMenuRight className='lg:hidden text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={() => setHam(true)} />
      
      <div className={`absolute lg:hidden top-0 w-full h-full bg-[#00000053] backdrop-blur-lg p-[20px] flex flex-col gap-[20px] items-start ${ham ? "translate-x-0" : "translate-x-full"} transition-transform`}>
        <RxCross1 className=' text-white absolute top-[20px] right-[20px] w-[25px] h-[25px]' onClick={() => setHam(false)} />
        <button className='min-w-[150px] h-[60px]  text-black font-semibold   bg-white rounded-full cursor-pointer text-[19px] ' onClick={handleLogOut}>Log Out</button>
        <button className='min-w-[150px] h-[60px]  text-black font-semibold  bg-white  rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] ' onClick={() => navigate("/customize")}>Customize your Assistant</button>
      </div>

      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold absolute hidden lg:block top-[20px] right-[20px]  bg-white rounded-full cursor-pointer text-[19px] ' onClick={handleLogOut}>Log Out</button>
      <button className='min-w-[150px] h-[60px] mt-[30px] text-black font-semibold  bg-white absolute top-[100px] right-[20px] rounded-full cursor-pointer text-[19px] px-[20px] py-[10px] hidden lg:block ' onClick={() => navigate("/customize")}>Customize your Assistant</button>
      
      <div className='w-[300px] h-[400px] flex justify-center items-center overflow-hidden rounded-4xl shadow-lg'>
        <img src={userData?.assistantImage} alt="" className='h-full object-cover' />
      </div>

      <h1 className='text-white text-[18px] font-semibold'>I'm {userData?.assistantName}</h1>
      
      {isSpeaking ? 
         <img src={aiImg} alt="AI Speaking" className='w-[200px]'/> : 
         <img src={userImg} alt="Listening" className='w-[200px]'/>
      }

      <h1 className='text-white text-[18px] font-semibold text-wrap px-4 text-center'>
        {userText ? `You: ${userText}` : aiText ? `AI: ${aiText}` : status}
      </h1>

    </div>
  )
}

export default Home