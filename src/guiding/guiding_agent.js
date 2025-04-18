import { FunctionCallingConfigMode, GoogleGenAI } from "@google/genai/web";

import {
  endAssistanceSessionElementDeclaration,
  highlightElement,
  highlightElementDeclaration,
  openWebPageFunctionDeclaration,
  openWindow,
} from "./guiding_functions";
import { getPageHTML, getScreenURI, getTabId } from "../getRessources";
import { hideModal, showModal } from "../main";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY,
});

let isGuidingSessionActive = false;
let activeTabId = null;
const guidingAgent = ai.chats.create({
  history: [],
  model: "gemini-2.0-flash",
  config: {
    systemInstruction: `
    You are an internet navigation assistant with two available functions:
    - **open_web_page**: To open a new webpage it should NEVER be called twice for the same website.
    - **highlight_element**: To highlight an element on the current page that the user needs to interact with to accomplish their task.

    ### Workflow:
    1. **Evaluate the user's query** to determine if they are requesting a specific website or page. If the page currently opened matches the user's request, proceed to the next step.
      
    2. **If the current page is the correct one** (i.e., the website or page the user wants is already open), use **highlight_element** to highlight the element the user needs to interact with to complete their task.

    3. **If the current page is not the correct one** (i.e., the user needs to be on a different page), use **open_web_page** to navigate to the correct page, and then use **highlight_element** to highlight the element the user needs to interact with.

    If the user is on a page with inputs highlight the inputs that are not filled in. Use the provided image to indentify the inputs that are not filled in.

    When the user query is attained, use **end_assistance_session** to end the session. It's very important to end the session when the user is done with their task.

    The query of the user is not necessarily the same as the page they are on. The user may for instance not be logged in. In this case you should guide them to login themself and then help them with their task.

    ### Key Notes:
    - Always base your actions on the user's request. 
    - Make sure the page corresponds to the user's query before proceeding with any interaction highlighting.
    - In case of a form, be thure to highlight all the inputs that are not filled in before highlighting send button.
    `,
    temperature: 0.5,
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingConfigMode.ANY,
      },
    },
    tools: [
      {
        functionDeclarations: [
          highlightElementDeclaration,
          openWebPageFunctionDeclaration,
          endAssistanceSessionElementDeclaration,
        ],
      },
    ],
  },
});
console.log("Guiding agent : ", guidingAgent);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "HIGHLIGHT_CHECK") {
    console.log("Going to next step");
    goToNextStep();
    sendResponse({ status: "ok" });
  }

  if (message.type === "PAGE_REFRESHED") {
    console.log("Starting guiding session with query : ", message.query);
    if (!isGuidingSessionActive || activeTabId !== message.tabId) {
      console.log("EHE NON CHECH JE NE SUIS PAS CHEZ MOI");
      return;
    }
    goToNextStep();
    sendResponse({ status: "ok" });
    return;
  }

  if (message.type === "ELEMENT_NOT_FOUND") {
    console.log("Element not found, sending message to guiding agent");
    sendElementNotFoundMessage();
    sendResponse({ status: "ok" });
    return;
  }
});

const sendElementNotFoundMessage = async () => {
  const currentHtml = await getPageHTML();
  const result = await guidingAgent.sendMessage({
    message: `HTML : ${currentHtml}. L'élément avec le xpath fourni n'a pas pu être trouvé. Il est **impératif** que celui-ci existe sur la page pour que l'assistant puisse fonctionner correctement. Vous devez donc indiquer un nouvel element à surligner ou arrêter la session ici.`,
  });

  if (result.functionCalls && result.functionCalls.length > 0) {
    for (const call of result.functionCalls) {
      const functionName = call.name;
      const functionArgs = call.args;
      if (functionName === "highlight_element") {
        highlightElement(functionArgs.xpath, functionArgs.indication);
        return "Mise en surbrillance de l'élément.";
      } else if (functionName === "end_assistance_session") {
        console.log("Ending assistance session.");
        stopGuidingSession();
        return "Assistance terminée.";
      }
    }
  }
};

export const stopGuidingSession = async () => {
  console.log("Stopping guiding session");
  isGuidingSessionActive = false;
  activeTabId = null;
  hideModal();
  guidingAgent.history = [];
};

export const startNewGuidanceSession = async (userQuery) => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const currentHtml = await getPageHTML();
  const image = await getScreenURI();
  activeTabId = await getTabId();
  console.log("Active tab id : ", activeTabId);
  if (!activeTabId) {
    return;
  }
  console.log("Starting new guiding session with query : ", userQuery);
  showModal();
  isGuidingSessionActive = true;

  console.log("Image uri : ", image);
  guidingAgent.history = [];

  sendGuidingMessage(
    `The user want to  : ${userQuery}
    The current page html is: ${currentHtml}`,
    currentHtml,
    image
  );
};

export const goToNextStep = async () => {
  console.log("History after filtering : ", guidingAgent.history);
  console.log("Sending html to guiding agent : ", guidingAgent);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("Julien est beau");
  const currentHtml = await getPageHTML();
  const image = await getScreenURI();
  await sendGuidingMessage(`HTML : ${await getPageHTML()}`, currentHtml, image);
};

export const sendGuidingMessage = async (query, currentHtml, image) => {
  const message = [
    {
      text: query,
    },
  ];

  if (image) {
    message.push({
      inlineData: {
        mimeType: "image/png",
        data: image.data,
      },
    });
  }
  const result = await guidingAgent.sendMessage({
    message,
  });

  const newHistory = [];
  const history = [...guidingAgent.history];
  for (const message of history) {
    // Skip function call messages
    if (message.parts[0]?.functionCall !== undefined) {
      newHistory.push(message);
      continue;
    }

    // Skip HTML messages
    if (message.parts[0]?.text?.startsWith("HTML :")) {
      continue;
    }
    // Keep all other messages
    newHistory.push(message);
  }
  guidingAgent.history = newHistory;

  if (result.functionCalls && result.functionCalls.length > 0) {
    await callFunctions(result.functionCalls, currentHtml);
  }
};

export const callFunctions = async (functionCalls, currentHtml) => {
  for (const call of functionCalls) {
    const functionName = call.name;
    const functionArgs = call.args;
    if (functionName === "open_web_page") {
      console.log("Opening web page with url : ", functionArgs.url);
      openWindow(functionArgs.url);
      activeTabId = await getTabId();
      await sendGuidingMessage(`HTML : ${currentHtml}`);
      return "Ouverture de la page.";
    } else if (functionName === "highlight_element") {
      console.log("Highlighting element with xpath : ", functionArgs.xpath);
      highlightElement(functionArgs.xpath, functionArgs.indication);
      return "Mise en surbrillance de l'élément.";
    } else if (functionName === "end_assistance_session") {
      console.log("Ending assistance session.");
      stopGuidingSession();
      return "Assistance terminée.";
    }
  }
};
