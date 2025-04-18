const html = document.documentElement.outerHTML;
// Retrieve the HTML of the current page

const checkButtonHTML = `
  <button class="highlight-check" id="highlight-check-button">
    <svg xmlns="http://www.w3.org/2000/svg" height="30" viewBox="0 0 24 24" width="30">
            <path d="M9 16.2l-3.5-3.5L4 14l5 5 10-10-1.5-1.5L9 16.2z"/>
      </svg>
  </button>
`;

let isHighlightActive = false;


function highlightElementByXPath(xpath, text) {
  const element = getElementByXPath(xpath);

  if (element) {
    isHighlightActive = true;
    element.classList.add("highlighted-element");

    // Récupérer la position de l'élément
    const rect = element.getBoundingClientRect();

    // texte
    const textElement = document.createElement("div");
    textElement.textContent = text;
    textElement.classList.add("highlight-text");
    textElement.style.top = `${rect.top + window.scrollY + element.offsetHeight + 10}px`;
    textElement.style.left = `${rect.left + window.scrollX}px`;
    document.body.appendChild(textElement);

    //scroll vers l'élément
    element.scrollIntoView({ behavior: "smooth", block: "center" });

    // Si l'élément est un champ de saisie, lui donner le focus
    if (
      (element.tagName === "INPUT" || element.tagName === "TEXTAREA") &&
      element.type !== "submit"
    ) {
      // Créer le bouton check
      const checkButton = document.createElement("div");
      checkButton.innerHTML = checkButtonHTML;

      checkButton.style.position = "absolute";
      checkButton.style.top = `${rect.top + window.scrollY - 1.5 * 16}px`; 
      checkButton.style.left = `${rect.left + window.scrollX + element.offsetWidth - 1.5 * 16}px`;
      checkButton.style.zIndex = "2147483647"; 

      document.body.appendChild(checkButton);

      //pour reset après le clic
      checkButton.onclick = () => {
        chrome.runtime.sendMessage({
          type: "HIGHLIGHT_CHECK",
        });
        element.classList.remove("highlighted-element");
        textElement.remove();
        checkButton.remove();
        isHighlightActive = false;
        element.onclick = null;
      };
    } else {
      //pour reset après le clic
      element.onclick = () => {
        chrome.runtime.sendMessage({
          type: "HIGHLIGHT_CHECK",
        });
        element.classList.remove("highlighted-element");
        textElement.remove();
        isHighlightActive = false;
        element.onclick = null;
      };
    }
  } else {
    console.log("Element not found for XPath:", xpath);
    chrome.runtime.sendMessage({
      type: "ELEMENT_NOT_FOUND",
    });
  }
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message in content script:", message);

  if (message.type === "CONTENT_GET_PAGE_HTML") {
    const html = document.documentElement.outerHTML;
    console.log("HTML of the current page in content:", html);
    sendResponse({ html });

    return true;
  }
});

function getElementByXPath(xpath) {
  return document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "highlight") {
    if (isHighlightActive) {
      sendResponse({
        status: "error",
        message: "Un highlight est déjà actif.",
      });
    } else {
      highlightElementByXPath(message.xpath, message.text);
      sendResponse({ status: "success", message: "Highlight ajouté." });
    }
  } else if (message.action === "get_highlight_status") {
    sendResponse({ isHighlightActive });
  }
});
