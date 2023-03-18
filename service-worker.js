const LOCAL_API_KEY_FIELD = 'copperfield-openai-key';

chrome.runtime.onInstalled.addListener(function () {

  chrome.contextMenus.create({
    id: "Copperfield",
    title: "Copperfield",
    documentUrlPatterns: ["https://*/*", "http://*/*", "file:///*"],
    contexts: ["all"],
  });

  chrome.contextMenus.create({
    title: '🤖 ChatGPT',
    parentId: "Copperfield",
    id: 'copperfield-chatgpt', // you'll use this in the handler function to identify this context menu item
    contexts: ['all'],
  });

  chrome.contextMenus.create({
    title: "⚡️ Prompt On-the-Fly",
    parentId: "Copperfield",
    id: "copperfield-prompt-fly",
    contexts: ["all"]
  });

  // Create a separator
  chrome.contextMenus.create({
    id: "separator",
    type: "separator",
    parentId: "Copperfield",
    contexts: ["all"],
  });

  chrome.storage.local.get(LOCAL_API_KEY_FIELD, function (oldOpenAIKey) {
    if (oldOpenAIKey[LOCAL_API_KEY_FIELD]) {
      chrome.action.setPopup({ popup: "" });
    }
    else {
      chrome.action.setPopup({ popup: "popup/popup.html" });
    }
  });
});

chrome.runtime.onStartup.addListener(function () {
  transferCustomPrompts(); // TURN OFF FIRST
  // sync custom prompts
  createContextMenu();
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.url.startsWith("chrome://") || tab.url === 'https://www.google.com/') return;
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['assets/library/jquery/jquery-1.12.3.min.js', 'assets/js/content.js']
  });
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

    var tab = tabs[0];

    if (info.menuItemId === "copperfield-chatgpt") { // here's where you'll need the ID
      chrome.storage.local.get(LOCAL_API_KEY_FIELD, function (oldOpenAIKey) {
        if (oldOpenAIKey[LOCAL_API_KEY_FIELD]) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['assets/js/content.js']
          });
        }
        else {
          chrome.windows.create({
            focused: true,
            width: 370,
            height: 320,
            type: 'popup',
            url: 'popup/popup.html',
            top: 0,
            left: 0
          },
            () => { });
        }
      });
    }
  });
});

chrome.tabs.onActivated.addListener(function (_activeInfo) {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
    let url = tabs[0].url;
    if ((url.startsWith('http') || url.startsWith('https')) && url !== 'https://www.google.com/') {
      chrome.action.setIcon({
        path: "assets/img/logo/logo-48.png",
      });
    }
    else {
      chrome.action.setIcon({
        path: "assets/img/logo/cf-icon-disabled@3x.png",
      });
    }
  });
});