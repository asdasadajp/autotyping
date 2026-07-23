// inject.js
// This script runs in the main page context.

console.log('[Zone Typing Hack] Inject script loaded (Proxy approach).');

let hackEnabled = false;
const listenerMap = new WeakMap();

const originalAddEventListener = EventTarget.prototype.addEventListener;
const originalRemoveEventListener = EventTarget.prototype.removeEventListener;

// イベントリスナーの登録を横取りし、コールバック関数をラップする
EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === 'keydown' || type === 'keypress') {
        const wrappedListener = function(e) {
            // ハックが有効で、単一文字の入力の場合
            if (hackEnabled && !e.simulated && e.key && e.key.length === 1) {
                const remainingElem = document.querySelector('[class*="_remaining_"]');
                
                if (remainingElem && remainingElem.innerText) {
                    const targetChar = remainingElem.innerText[0];
                    const keyCodeVal = targetChar.toUpperCase().charCodeAt(0);
                    
                    // Proxyを使って、ゲーム側が e.key を読み取った時に「正解のキー」を返すように偽装する
                    const proxyEvent = new Proxy(e, {
                        get(target, prop) {
                            if (prop === 'key') return targetChar;
                            if (prop === 'code') return 'Key' + targetChar.toUpperCase();
                            if (prop === 'keyCode' || prop === 'which') return keyCodeVal;
                            
                            const value = target[prop];
                            // メソッドなら本来のイベントにバインドして返す
                            if (typeof value === 'function') {
                                return value.bind(target);
                            }
                            return value;
                        }
                    });
                    
                    // 偽装したイベントをゲームのリスナーに渡す
                    if (typeof listener === 'function') {
                        return listener.call(this, proxyEvent);
                    } else if (listener && typeof listener.handleEvent === 'function') {
                        return listener.handleEvent(proxyEvent);
                    }
                }
            }
            
            // 通常の動作
            if (typeof listener === 'function') {
                return listener.call(this, e);
            } else if (listener && typeof listener.handleEvent === 'function') {
                return listener.handleEvent(e);
            }
        };
        
        // 削除できるように元のリスナーとラップしたリスナーを紐付けて保存
        if (listener && (typeof listener === 'object' || typeof listener === 'function')) {
            listenerMap.set(listener, wrappedListener);
        }
        return originalAddEventListener.call(this, type, wrappedListener, options);
    }
    return originalAddEventListener.call(this, type, listener, options);
};

// リスナーの解除も正しく伝播させる（メモリリーク・重複実行防止）
EventTarget.prototype.removeEventListener = function(type, listener, options) {
    if ((type === 'keydown' || type === 'keypress') && listener && (typeof listener === 'object' || typeof listener === 'function') && listenerMap.has(listener)) {
        return originalRemoveEventListener.call(this, type, listenerMap.get(listener), options);
    }
    return originalRemoveEventListener.call(this, type, listener, options);
};

window.ZoneTypingHack = {
    enable: function() {
        if (hackEnabled) return;
        hackEnabled = true;
        console.log('[Zone Typing Hack] 判定ハック機能(Proxy版)を有効化しました。');
        this.notifyState();
    },
    disable: function() {
        if (!hackEnabled) return;
        hackEnabled = false;
        console.log('[Zone Typing Hack] 判定ハック機能(Proxy版)を無効化しました。');
        this.notifyState();
    },
    toggle: function() {
        if (hackEnabled) this.disable();
        else this.enable();
    },
    notifyState: function() {
        window.postMessage({
            source: 'ZONE_TYPING_INJECT',
            type: 'HACK_STATE_CHANGED',
            enabled: hackEnabled
        }, '*');
    }
};

// Listen for messages from content script
window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data && event.data.source === 'ZONE_TYPING_EXTENSION') {
        if (event.data.type === 'TOGGLE_HACK') {
            if (event.data.enabled) {
                window.ZoneTypingHack.enable();
            } else {
                window.ZoneTypingHack.disable();
            }
        }
    }
});

// Listen for Ctrl+Shift to toggle hack
originalAddEventListener.call(window, 'keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey) {
        window.ZoneTypingHack.toggle();
    }
});

