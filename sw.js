// Ein ganz simpler Service Worker, der dem iPad signalisiert: "Ich bin App-fähig!"
self.addEventListener('install', (e) => {
    console.log('Service Worker: App wird installiert');
});

self.addEventListener('fetch', (e) => {
    // Lässt alle Netzwerkanfragen normal durch
});