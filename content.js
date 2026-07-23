// content.js
// Inject the hack script into the main page context so it can override globals like EventTarget
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);

console.log('[Zone Typing Hack] Content script loaded and inject.js injected.');

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TOGGLE_HACK') {
        // Forward the message to the injected script
        window.postMessage({
            source: 'ZONE_TYPING_EXTENSION',
            type: 'TOGGLE_HACK',
            enabled: message.enabled
        }, '*');
    }
});

// Listen for messages from the injected script (e.g., when Esc is pressed)
window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data && event.data.source === 'ZONE_TYPING_INJECT') {
        if (event.data.type === 'HACK_STATE_CHANGED') {
            // Update the storage so the popup stays in sync
            chrome.storage.local.set({ hackEnabled: event.data.enabled });
        }
    }
});

// Load initial state and send it once
chrome.storage.local.get(['hackEnabled'], (result) => {
    const isEnabled = result.hackEnabled !== false; // default true
    // Wait a little for inject.js to load
    setTimeout(() => {
        window.postMessage({
            source: 'ZONE_TYPING_EXTENSION',
            type: 'TOGGLE_HACK',
            enabled: isEnabled
        }, '*');
    }, 500);
});
