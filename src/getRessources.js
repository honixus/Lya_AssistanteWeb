export async function getPageHTML() {
  let isThinking = true;
  let value = null;

  chrome.runtime.sendMessage({ type: "GET_PAGE_HTML" }, (response) => {
    console.log("Response from background script:", response);
    if (response && response.html) {
      console.log("HTML of the current page:", response.html.length);
      console.log(
        "CLEANED HTML of the current page:",
        cleanHtml(response.html).length
      );
      isThinking = false;
      value = cleanHtml(response.html);
    } else {
      console.error("No HTML received from the background script.");
      isThinking = false;
    }
  });

  while (isThinking) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return value;
}

function cleanHtml(htmlContent) {
  if (!htmlContent || typeof htmlContent !== "string") {
    throw new Error("Invalid input: HTML content must be a non-empty string");
  }

  // Remove <head> section which typically contains metadata
  let cleanedHtml = htmlContent.replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, "");
  // console.log("Cleaned HTML after removing <head>:", cleanedHtml.length);

  // Remove all script tags and their content
  cleanedHtml = cleanedHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  // console.log("Cleaned HTML after removing <script>:", cleanedHtml.length);

  // Remove meta tags
  cleanedHtml = cleanedHtml.replace(/<meta\b[^>]*>/gi, "");
  // console.log("Cleaned HTML after removing <meta>:", cleanedHtml.length);

  // Remove link tags (optional, often used for stylesheets and other metadata)
  cleanedHtml = cleanedHtml.replace(/<link\b[^>]*>/gi, "");
  // console.log("Cleaned HTML after removing <link>:", cleanedHtml.length);

  // Remove title tags
  cleanedHtml = cleanedHtml.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "");
  // console.log("Cleaned HTML after removing <title>:", cleanedHtml.length);

  // Remove style tags and their content
  cleanedHtml = cleanedHtml.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
  // console.log("Cleaned HTML after removing <style>:", cleanedHtml.length);

  // Remove comments which might contain metadata or scripts
  cleanedHtml = cleanedHtml.replace(/<!--[\s\S]*?-->/g, "");
  // console.log("Cleaned HTML after removing comments:", cleanedHtml.length);

  // Remove iframe elements and their content
  cleanedHtml = cleanedHtml.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "");
  // console.log("Cleaned HTML after removing <iframe>:", cleanedHtml.length);

  // Remove noscript elements and their content
  cleanedHtml = cleanedHtml.replace(
    /<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi,
    ""
  );
  // console.log("Cleaned HTML after removing <noscript>:", cleanedHtml.length);

  // Remove SVG path elements
  cleanedHtml = cleanedHtml.replace(/<path\b[^>]*\/?>[\s\S]*?<\/path>?/gi, "");
  // console.log("Cleaned HTML after removing <path>:", cleanedHtml.length);
  cleanedHtml = cleanedHtml.replace(/<path\b[^>]*\/>/gi, "");
  // console.log("Cleaned HTML after removing <path>:", cleanedHtml.length);

  // Remove style attributes from HTML tags
  cleanedHtml = cleanedHtml.replace(/\s+style\s*=\s*["'][^"']*["']/gi, "");
  // console.log(
  //   "Cleaned HTML after removing style attributes:",
  //   cleanedHtml.length
  // );

  cleanedHtml = cleanedHtml.replace(/class="([^"]{50,})"/gi, "");

  // Remove any empty spaces at the beginning and end
  cleanedHtml = cleanedHtml.trim();
  // console.log("Cleaned HTML after trimming:", cleanedHtml.length);

  console.log(cleanedHtml);
  return cleanedHtml;
}

function filterByClick(htmlContent) {
  // Regex pour capturer les éléments <a>, <button>, <input> et ceux qui ont l'attribut onClick
  const regex =
    /<(a|button|input)([^>]*?onClick=["'][^"]*["'][^>]*|[^>]*)(.*?)<\/\1>/gi;

  let newContent = "";
  let match;

  // Parcourir toutes les correspondances
  while ((match = regex.exec(htmlContent)) !== null) {
    newContent += match[0]; // Ajouter l'élément HTML correspondant
  }

  return newContent;
}

export function listenForPageHTML(callback) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // console.log("Received message:", message);
    if (message.type === "SEND_PAGE_HTML") {
      // console.log("Page HTML received:", message.html);
      callback(message.html);
    } else if (message.type === "GET_SCREEN") {
      //message.screenUri renvoie le lien vers la capture d'écran
      // console.log("screen uri: " + message.imageUri);
    }
    sendResponse("OK");
  });
}

export async function getTabId() {
  let value = null;
  let isThinking = true;

  chrome.runtime.sendMessage({ type: "GET_TAB_ID" }, (response) => {
    console.log("Response from background script:", response);
    if (response && response.tabId) {
      console.log("Tab ID received:", response.tabId);
      isThinking = false;
      value = response.tabId;
    } else {
      console.error("No tab ID received from the background script.");
      isThinking = false;
    }
  });

  while (isThinking) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return value;
}

export async function getScreenURI() {
  let value = null;
  let isThinking = true;

  chrome.runtime.sendMessage({ type: "GET_SCREEN_URI" }, (response) => {
    if (response && response.screenUri) {
      console.log("Screen URI received:", response.screenUri);
      isThinking = false;
      value = response.screenUri;
    } else {
      console.error("No screen URI received from the background script.");
      isThinking = false;
    }
  });

  while (isThinking) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  if (value == null) {
    return null;
  }

  const data = value.split(",");
  return {
    mimeType: data[0].split(":")[1].split(";")[0],
    data: data[1],
  };
}
