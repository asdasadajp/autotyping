// popup.js

document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('hackToggle');

    // Load initial state
    chrome.storage.local.get(['hackEnabled'], (result) => {
        // Default to true if not set
        toggle.checked = result.hackEnabled !== false;
    });

    // Save and send state on change
    toggle.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        
        // Save to storage
        chrome.storage.local.set({ hackEnabled: isEnabled });

        // Send message to active tab
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'TOGGLE_HACK',
                    enabled: isEnabled
                });
            }
        });
    });
});
