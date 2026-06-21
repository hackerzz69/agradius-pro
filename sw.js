// AgRadius Pro
// Service Worker
// Root file: /sw.js

"use strict";

/* =====================================
   CACHE CONFIG
===================================== */

const CACHE_VERSION = "v1.0.0";

const STATIC_CACHE =
    `agradius-static-${CACHE_VERSION}`;

const RUNTIME_CACHE =
    `agradius-runtime-${CACHE_VERSION}`;

const APP_SHELL = [

    "./",
    "./index.html",

    "./css/style.css",
    "./css/hero.css",
    "./css/buttons.css",
    "./css/cards.css",
    "./css/map.css",
    "./css/mobile.css",

    "./js/app.js",
    "./js/ui.js",
    "./js/radius.js",
    "./js/map.js",
    "./js/gps.js",
    "./js/loves.js",
    "./js/install.js",

    "./pwa/manifest.json",

    "./data/loves_locations_lite.json",

    "./assets/truck.png",
    "./assets/usa-map.png",

    "./icons/menu.svg",
    "./icons/bell.svg",
    "./icons/shield.svg",
    "./icons/gps.svg",
    "./icons/map.svg",
    "./icons/route.svg",
    "./icons/center.svg",
    "./icons/radius.svg",
    "./icons/loves.svg",

    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./icons/maskable-512.png"

];

/* =====================================
   INSTALL
===================================== */

self.addEventListener("install", event => {

    event.waitUntil(
        installServiceWorker()
    );

    self.skipWaiting();

});

async function installServiceWorker(){

    const cache =
        await caches.open(STATIC_CACHE);

    await Promise.allSettled(
        APP_SHELL.map(url => {

            return cache.add(url);

        })
    );

}

/* =====================================
   ACTIVATE
===================================== */

self.addEventListener("activate", event => {

    event.waitUntil(
        activateServiceWorker()
    );

    self.clients.claim();

});

async function activateServiceWorker(){

    const cacheNames =
        await caches.keys();

    await Promise.all(
        cacheNames.map(cacheName => {

            const isCurrentStatic =
                cacheName === STATIC_CACHE;

            const isCurrentRuntime =
                cacheName === RUNTIME_CACHE;

            if(
                !isCurrentStatic &&
                !isCurrentRuntime
            ){

                return caches.delete(cacheName);

            }

            return Promise.resolve();

        })
    );

}

/* =====================================
   FETCH
===================================== */

self.addEventListener("fetch", event => {

    const request =
        event.request;

    if(request.method !== "GET"){

        return;

    }

    const url =
        new URL(request.url);

    if(url.origin !== self.location.origin){

        return;

    }

    if(request.mode === "navigate"){

        event.respondWith(
            networkFirstNavigation(request)
        );

        return;

    }

    event.respondWith(
        staleWhileRevalidate(request)
    );

});

/* =====================================
   NETWORK-FIRST NAVIGATION
===================================== */

async function networkFirstNavigation(request){

    try{

        const networkResponse =
            await fetch(request);

        const cache =
            await caches.open(RUNTIME_CACHE);

        cache.put(
            request,
            networkResponse.clone()
        );

        return networkResponse;

    }catch(error){

        const cachedResponse =
            await caches.match(request);

        if(cachedResponse){

            return cachedResponse;

        }

        return caches.match("./index.html");

    }

}

/* =====================================
   STALE-WHILE-REVALIDATE STATIC
===================================== */

async function staleWhileRevalidate(request){

    const cache =
        await caches.open(RUNTIME_CACHE);

    const cachedResponse =
        await cache.match(request);

    const networkFetch =
        fetch(request)
            .then(networkResponse => {

                if(
                    networkResponse &&
                    networkResponse.status === 200
                ){

                    cache.put(
                        request,
                        networkResponse.clone()
                    );

                }

                return networkResponse;

            })
            .catch(() => {

                return null;

            });

    return cachedResponse || networkFetch;

}

/* =====================================
   MESSAGE HANDLER
===================================== */

self.addEventListener("message", event => {

    if(!event.data){

        return;

    }

    if(event.data.type === "SKIP_WAITING"){

        self.skipWaiting();

    }

});
