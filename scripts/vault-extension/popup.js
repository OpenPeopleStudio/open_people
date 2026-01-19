/**
 * Vault Quick Upload - Popup Script
 */

const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const status = document.getElementById("status");
const configStatus = document.getElementById("configStatus");
const optionsLink = document.getElementById("optionsLink");

// Check configuration on load
chrome.runtime.sendMessage({ action: "getConfig" }, (config) => {
  if (config?.endpoint && config?.token) {
    configStatus.textContent = "Connected";
    configStatus.classList.add("configured");
  } else {
    configStatus.textContent = "Not configured";
    configStatus.classList.remove("configured");
  }
});

// Options link
optionsLink.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

// Drag and drop
dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("dragover");
});

dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  
  if (e.dataTransfer.files.length > 0) {
    uploadFile(e.dataTransfer.files[0]);
  }
});

// Click to select
dropzone.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    uploadFile(fileInput.files[0]);
  }
});

async function uploadFile(file) {
  showStatus("loading", `Uploading ${file.name}...`);
  
  try {
    // Convert file to base64
    const reader = new FileReader();
    const fileData = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    
    // Send to background script
    const result = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { action: "upload", file: fileData, filename: file.name },
        resolve
      );
    });
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    let message = `✓ ${file.name}`;
    if (result.ai_category) {
      message += `\nCategory: ${result.ai_category}`;
    }
    if (result.auto_approved) {
      message += "\nStatus: Auto-approved";
    } else {
      message += "\nStatus: Pending review";
    }
    
    showStatus("success", message);
    
    // Reset file input
    fileInput.value = "";
    
  } catch (err) {
    showStatus("error", err.message);
  }
}

function showStatus(type, message) {
  status.className = `status ${type}`;
  status.textContent = message;
  status.style.whiteSpace = "pre-line";
}
