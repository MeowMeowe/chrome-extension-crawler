export async function initializeStorage() {
    const { initialized } = await chrome.storage.local.get('initialized');
    if (!initialized) {
        const initialData = await fetch(chrome.runtime.getURL('cnki.json'))
            .then(response => response.json());

        await chrome.storage.local.set({
            journals: initialData,
            processed: [],
            initialized: true
        });
    }
}

export async function resetStorage() {
    await chrome.storage.local.clear();
    await initializeStorage();
}