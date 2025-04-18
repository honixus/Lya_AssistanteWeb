// Set up the side panel when the extension is installed
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message in background:", message);

  if (message.type === "GET_PAGE_HTML") {
    chrome.tabs.query({ active: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error("No active tab found.");
        sendResponse({ html: null });
        return;
      }

      const tabId = tabs[0].id;
      fetchPageHTML(tabId, sendResponse);
    });

    return true;
  }

  if (message.type === "GET_SCREEN_URI") {
    console.log("Getting screen URI...");
    chrome.tabs.query({ active: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error("No active tab found.");
        sendResponse({ screenUri: null });
        return;
      }

      const tabId = tabs[0].id;
      chrome.tabs.captureVisibleTab(
        tabs[0].windowId,
        { format: "png" },
        (imageUri) => {
          sendResponse({ screenUri: imageUri });
        }
      );
    });

    return true;
  } else if (message.type === "GET_TAB_ID") {
    chrome.tabs.query({ active: true }, (tabs) => {
      if (tabs.length === 0) {
        console.error("No active tab found.");
        sendResponse({ tab_id: null });
        return;
      }

      const tabId = tabs[0].id;
      sendResponse({ tabId });
    });
    return true;
  }
});

// Fonction pour récupérer l'HTML d'une page
function fetchPageHTML(tabId, callback) {
  chrome.scripting.executeScript(
    {
      target: { tabId },
      function: () => {
        console.log("Inner HTML : ", document.body.innerHTML);
        console.log("outer HTML : ", document.documentElement.outerHTML);
        return document.body.innerHTML;
      },
    },
    (results) => {
      console.log("PROCESSING RESULT:", results);
      if (chrome.runtime.lastError) {
        console.error("Script execution error:", chrome.runtime.lastError);
        callback({ html: null });
        return;
      }

      if (!results || !results[0]) {
        console.error("No HTML received from content script.");
        callback({ html: null });
        return;
      }

      console.log("HTML successfully retrieved : ", results);
      callback({ html: results[0].result });

      // Envoi automatique au sidebar si nécessaire
      chrome.runtime.sendMessage({
        type: "SEND_PAGE_HTML",
        html: results[0].result,
      });
    }
  );
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) {
    // console.log("Page loaded, fetching new HTML...");
    chrome.runtime.sendMessage({
      type: "PAGE_REFRESHED",
      tabId,
    });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({
    path: "index.html",
    enabled: true,
  });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"], // Inject content.js into the active tab
  });
});
