/**
 * Vault Quick Upload - Options Script
 */

const endpointInput = document.getElementById("endpoint");
const tokenInput = document.getElementById("token");
const saveBtn = document.getElementById("saveBtn");
const testBtn = document.getElementById("testBtn");
const status = document.getElementById("status");

// Load existing config
chrome.storage.sync.get(["endpoint", "token"], (config) => {
  if (config.endpoint) endpointInput.value = config.endpoint;
  if (config.token) tokenInput.value = config.token;
});

// Save settings
saveBtn.addEventListener("click", () => {
  const endpoint = endpointInput.value.trim();
  const token = tokenInput.value.trim();
  
  if (!endpoint) {
    showStatus("error", "Please enter an API endpoint");
    return;
  }
  
  if (!token) {
    showStatus("error", "Please enter an upload token");
    return;
  }
  
  if (!token.startsWith("qs_")) {
    showStatus("error", "Token should start with 'qs_'");
    return;
  }
  
  chrome.storage.sync.set({ endpoint, token }, () => {
    showStatus("success", "Settings saved successfully!");
  });
});

// Test connection
testBtn.addEventListener("click", async () => {
  const endpoint = endpointInput.value.trim();
  const token = tokenInput.value.trim();
  
  if (!endpoint || !token) {
    showStatus("error", "Please fill in both fields first");
    return;
  }
  
  showStatus("", "Testing connection...");
  status.style.display = "block";
  status.style.background = "rgba(200, 255, 0, 0.05)";
  status.style.borderColor = "rgba(200, 255, 0, 0.1)";
  status.style.color = "#c8ff00";
  
  try {
    // Send OPTIONS request to check connectivity
    const response = await fetch(endpoint, {
      method: "OPTIONS",
      headers: {
        "x-vault-token": token,
      },
    });
    
    if (response.ok || response.status === 204) {
      showStatus("success", "Connection successful! Ready to upload.");
    } else {
      showStatus("error", `Connection failed: HTTP ${response.status}`);
    }
  } catch (err) {
    showStatus("error", `Connection failed: ${err.message}`);
  }
});

function showStatus(type, message) {
  status.textContent = message;
  status.className = `status ${type}`;
  
  if (type) {
    status.style.display = "block";
  }
}
