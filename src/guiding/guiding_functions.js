import { Type } from "@google/genai/web";

export const openWebPageFunctionDeclaration = {
  name: "open_web_page",
  description:
    "Opens the page on the browser of the client. CAN ONLY BE CALLED ONCE. SHOULD ABSOLUTLY UNDER ANY CIRCUMSTANCES BE CALLED TWICE.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: "The https URL to open. Should be the root of a website",
      },
    },
    required: ["url"],
  },
};

export const highlightElementDeclaration = {
  name: "highlight_element",
  description:
    "Highlights an element on the current web page based on its XPath and optional text content.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      xpath: {
        type: Type.STRING,
        description: "The XPath of the element to highlight.",
      },
      indication: {
        type: Type.STRING,
        description:
          "A textual indication in french that explains the reason why the user need to interact with this element.",
      },
    },
    required: ["xpath", "indication"],
  },
  returns: {
    type: Type.BOOLEAN,
    description:
      "True if the highlight was successful, false if it impossible (due to an already active highlight).",
  },
};

export const endAssistanceSessionElementDeclaration = {
  name: "end_assistance_session",
  description:
    "Ends the assistance when the query of the user is fullfilled. For instance if the user ask to open his profile, the session is ended when the profile is opened.",
  returns: {
    type: Type.BOOLEAN,
    description:
      "True if the highlight was successful, false if it impossible (due to an already active highlight).",
  },
};

export function openWindow(url) {
  console.log("Opening URL:", url);
  window.open(url, "_blank");
}

export function highlightElement(xpath, text) {
  console.log(
    "Tentative de surlignage de l'élément avec XPath:",
    xpath,
    "et texte:",
    text
  );

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const tabId = tabs[0].id;

      // Vérifier si un highlight est déjà actif
      chrome.tabs.sendMessage(
        tabId,
        { action: "get_highlight_status" },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Erreur lors de la vérification de l'état du highlight:",
              chrome.runtime.lastError
            );
          } else if (response.isHighlightActive) {
            console.warn(
              "Un highlight est déjà actif. Veuillez le désactiver avant d'en ajouter un nouveau."
            );
            console.log("false");
            return false;
          } else {
            // Envoyer la demande de surlignage
            chrome.tabs.sendMessage(
              tabId,
              { action: "highlight", xpath, text },
              (response) => {
                if (chrome.runtime.lastError) {
                  console.error(
                    "Erreur lors de l'envoi du message:",
                    chrome.runtime.lastError
                  );
                } else {
                  console.log("Réponse du content script:", response);
                  console.log("true");
                  return true;
                }
              }
            );
          }
        }
      );
    }
  });
}
