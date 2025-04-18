document.addEventListener("DOMContentLoaded", function () {
    const fontSizeSlider = document.getElementById("fontSizeSlider");
    const fontSizeValue = document.getElementById("fontSizeValue");

    const userName = document.getElementById("userName");
    const moreInfo = document.getElementById("moreInfo");

    settingsButton.addEventListener("click", function () {
      const chatInterface = document.getElementById("chatInterface");
      const settingsInterface = document.getElementById("settingsInterface");
      
      chatInterface.classList.add("hidden");
      settingsInterface.classList.remove("hidden");
    });
  
    document.getElementById("backButton").addEventListener("click", function() {
      const chatInterface = document.getElementById("chatInterface");
      const settingsInterface = document.getElementById("settingsInterface");
      
      settingsInterface.classList.add("hidden");
      chatInterface.classList.remove("hidden");
    });
  
    
    function setFontSize(size) {
      document.documentElement.style.setProperty('--font-size', `${size}px`);
      document.body.style.fontSize = `${size}px`;
      fontSizeValue.textContent = `${size}`;
      fontSizeSlider.value = size;

    }

    function setUserName(name) {
        userName.value = name;
    }
      

    function setMoreInfo(value) {
        moreInfo.value = value;
    }

    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['fontsize','name','moreInfo'], function(result) {
        const size = result.fontsize || 16;
        setFontSize(size)
        setUserName(result.name || '');
        setMoreInfo(result.moreInfo || '');
      });
    } else {
      setFontSize(16);
      setUserName('');
      setMoreInfo('');
    }  
  
    if (fontSizeSlider) {
      fontSizeSlider.addEventListener("input", function() {
        const size = this.value;
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ fontsize: size });
        }
        setFontSize(size);
      });
    }

    function saveUserName() {
      const name = userName.value;
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ name: name });
      }
    }


    function saveMoreInfo() {
        const value = moreInfo.value;
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ moreInfo: value });
        }
    }

    moreInfo.addEventListener('input', saveMoreInfo);
    userName.addEventListener('input', saveUserName);
  });

function setupAutoResizeTextarea() {
  const textarea = document.getElementById('moreInfo');
  if (!textarea) return;
  
  const adjustHeight = () => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  textarea.addEventListener('input', adjustHeight);
  
  setTimeout(adjustHeight, 0);
}

// Call setup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  setupAutoResizeTextarea();
});



