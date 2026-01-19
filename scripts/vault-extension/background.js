/**
 * Vault Quick Upload - Background Service Worker
 */

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "upload-to-vault",
    title: "Upload to Vault",
    contexts: ["image", "link", "selection"]
  });
  
  chrome.contextMenus.create({
    id: "upload-image-to-vault",
    title: "Upload image to Vault",
    contexts: ["image"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "upload-image-to-vault" && info.srcUrl) {
    await uploadFromUrl(info.srcUrl, "image");
  } else if (info.menuItemId === "upload-to-vault" && info.linkUrl) {
    await uploadFromUrl(info.linkUrl, "link");
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "upload") {
    uploadFile(message.file, message.filename)
      .then(sendResponse)
      .catch(err => sendResponse({ error: err.message }));
    return true; // Keep channel open for async response
  }
  
  if (message.action === "getConfig") {
    chrome.storage.sync.get(["endpoint", "token"], sendResponse);
    return true;
  }
  
  if (message.action === "setConfig") {
    chrome.storage.sync.set(message.config, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

async function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["endpoint", "token"], resolve);
  });
}

async function uploadFromUrl(url, type) {
  const config = await getConfig();
  
  if (!config.endpoint || !config.token) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Vault Upload",
      message: "Please configure your vault token in extension options."
    });
    return;
  }
  
  try {
    // Fetch the file
    const response = await fetch(url);
    const blob = await response.blob();
    
    // Extract filename from URL
    const urlObj = new URL(url);
    let filename = urlObj.pathname.split("/").pop() || "file";
    if (!filename.includes(".")) {
      // Add extension based on content type
      const ext = blob.type.split("/")[1] || "bin";
      filename += "." + ext;
    }
    
    // Upload
    const result = await uploadBlob(blob, filename, config);
    
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Uploaded to Vault",
      message: `${filename}\n${result.ai_category || "Uploaded successfully"}`
    });
    
  } catch (err) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Upload Failed",
      message: err.message
    });
  }
}

async function uploadFile(fileData, filename) {
  const config = await getConfig();
  
  if (!config.endpoint || !config.token) {
    throw new Error("Please configure your vault token");
  }
  
  // Convert base64 to blob
  const byteString = atob(fileData.split(",")[1]);
  const mimeType = fileData.match(/data:([^;]+)/)?.[1] || "application/octet-stream";
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: mimeType });
  
  return uploadBlob(blob, filename, config);
}

async function uploadBlob(blob, filename, config) {
  const formData = new FormData();
  formData.append("file", blob, filename);
  
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "x-vault-token": config.token,
    },
    body: formData,
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || "Upload failed");
  }
  
  return result;
}
