import {
  getPageHTML,
  listenForPageHTML,
  getScreenURI,
} from "./getRessources.js";

import { sendMessage, updateSystemPrompt } from "./chatbot";

import "./style.css";
import { stopGuidingSession } from "./guiding/guiding_agent.js";

const chatContainer = document.getElementById("chatContainer");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const typingIndicator = document.getElementById("typingIndicator");
const settingsButton = document.getElementById("settingsButton");
const userNameDisplay = document.getElementById("user-name-display");
const modalOverlay = document.getElementById("modalOverlay");
const cancelButton = document.getElementById("cancelButton");

let isThinking = false;
const updateSystemPromptWithUserInfo = async () => {
  return new Promise((Resolve) => {
    chrome.storage.local.get(["name", "moreInfo"], function (result) {
      const userName = result.name || "None";
      const moreInfo = result.moreInfo || "None";

      console.log("userName", userName);
      console.log("moreInfo", moreInfo);

      // Construct the prompt
      const prompt = `userName: ${userName} moreInfo: ${moreInfo}`;
      console.log("Prompt:", prompt);

      // Resolve the promise with the prompt
      Resolve(prompt);
    });
  });
};

const updateUserNameDisplay = () => {
  let username = "";
  chrome.storage.local.get("name", function (result) {
    if (result.name) {
      username = result.name;
    }
    userNameDisplay.textContent = username;
  });
};

updateUserNameDisplay();

updateSystemPromptWithUserInfo().then((prompt) => {
  updateSystemPrompt(prompt);
});

// Function to scroll to the bottom of chat
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Function to create a message element
function createMessage(text, isUser) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");
  messageDiv.classList.add(isUser ? "user-message" : "bot-message");
  messageDiv.textContent = text;
  return messageDiv;
}

// Function to show typing indicator
function showTypingIndicator() {
  typingIndicator.classList.add("show");
  typingIndicator.parentElement.appendChild(typingIndicator);
  scrollToBottom();
}

// Function to hide typing indicator
function hideTypingIndicator() {
  typingIndicator.classList.remove("show");
}

// Function to generate a bot response
async function getBotResponse(userText) {
  return await sendMessage(userText);
}

// Function to handle sending a message
function displaySendMessage() {
  if (isThinking == true) return;
  isThinking = true;

  const text = userInput.value.trim();
  if (!text) return;

  // Add user message to chat
  chatContainer.appendChild(createMessage(text, true));
  scrollToBottom();

  // Clear input
  userInput.value = "";
  userInput.style.height = "auto";

  // Show typing indicator
  showTypingIndicator();

  // Simulate bot thinking and then responding
  setTimeout(async () => {
    hideTypingIndicator();

    // Add bot response
    const botResponse = await getBotResponse(text);
    isThinking = false;
    chatContainer.appendChild(createMessage(botResponse, false));
    scrollToBottom();
  }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
}

// Function to show the modal
export function showModal() {
  modalOverlay.classList.remove("hidden");
}

// Function to hide the modal
export function hideModal() {
  modalOverlay.classList.add("hidden");
  stopGuidingSession();
}

// Event listener for the cancel button
cancelButton.addEventListener("click", hideModal);

// Event listeners
sendButton.addEventListener("click", displaySendMessage);
sendButton.addEventListener("click", sendMessage);

settingsButton.addEventListener("click", function () {
  const chatInterface = document.getElementById("chatInterface");
  const settingsInterface = document.getElementById("settingsInterface");

  chatInterface.classList.add("hidden");
  settingsInterface.classList.remove("hidden");
});

userInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    displaySendMessage();
  }
});

userInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";

  sendButton.disabled = this.value.trim() === "";
});

userInput.focus();

export let html;
