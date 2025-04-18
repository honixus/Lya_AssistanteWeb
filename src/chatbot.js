import { GoogleGenAI } from "@google/genai/web";
import { guideUser, guideUserFunctionDeclaration } from "./chatbot_functions";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
});

const chat = ai.chats.create({
  model: "gemini-2.0-flash",
  history: [],
  config: {
    systemInstruction: `
    You are an assistant tasked with determining if the user's request requires help from a web navigation assistant. 

    - **Call the function 'guide_user'** if the user requests help for navigating a website, completing a task on a website, or needs guidance on interacting with specific elements on a page.
    - If the user's request does **not** involve navigating or interacting with a website, **provide a relevant and helpful response** based on the user's query. Avoid calling the function unless necessary.

    **Important note**: You must always respond in French, even if the request is in English or another language.
    Be sure to distinguish between tasks that involve active navigation and general inquiries or questions.`,
    tools: [
      {
        functionDeclarations: [guideUserFunctionDeclaration],
      },
    ],
    temperature: 0.5,
  },
});

export const sendMessage = async (userText) => {
  const result = await chat.sendMessage({
    message: userText,
  });

  if (result.functionCalls && result.functionCalls.length > 0) {
    await callFunctions(result.functionCalls);
    return "Je vais vous guider pas à pas....";
  } else {
    return result.text;
  }
};

export const updateSystemPrompt = async (newSystemPrompt) => {
  chat.config.systemInstruction += newSystemPrompt;
};

const callFunctions = async (functionCalls) => {
  for (const call of functionCalls) {
    const functionName = call.name;
    const functionArgs = call.args;
    if (functionName == "guide_user") {
      return await guideUser(functionArgs.query);
    }
  }
};
