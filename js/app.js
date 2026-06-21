// AgRadius Pro
// Main App Controller
// This file starts the app and connects all modules together.

"use strict";

/* =====================================
   APP CONTEXT
===================================== */

const AgRadiusPro = {

    config: {

        appName: "AgRadius Pro",

        defaultCenter: [
            39.8283,
            -98.5795
        ],

        defaultZoom: 4,

        activeZoom: 8,

        radiusMiles: 150,

        metersPerMile: 1609.344,

        gps: {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 5000
        },

        data: {
            loves: "data/loves_locations_lite.json"
        },

        selectors: {
            map: "map",
            gpsStatus: "gpsStatus",
            centerCoords: "centerCoords",
            radiusDisplay: "radiusDisplay",
            locateBtn: "locateBtn"
        }

    },

    state: {

        ready: false,

        currentCenter: null,

        currentAccuracy: null,

        radiusMiles: 150,

        map: null,

        centerMarker: null,

        radiusCircle: null,

        loveMarkers: [],

        loveLayer: null,

        deferredInstallPrompt: null

    },

    els: {},

    modules: {},

    events: {}

};

window.AgRadiusPro = AgRadiusPro;

/* =====================================
   START APP
===================================== */

document.addEventListener("DOMContentLoaded", () => {

    startApp();

});

async function startApp(){

    cacheElements();

    setSafeDefaults();

    await loadModules();

    await initializeModules();

    connectGlobalButtons();

    AgRadiusPro.state.ready = true;

    console.log("AgRadius Pro loaded.");

}

/* =====================================
   CACHE DOM ELEMENTS
===================================== */

function cacheElements(){

    const selectors = AgRadiusPro.config.selectors;

    AgRadiusPro.els.map =
        document.getElementById(selectors.map);

    AgRadiusPro.els.gpsStatus =
        document.getElementById(selectors.gpsStatus);

    AgRadiusPro.els.centerCoords =
        document.getElementById(selectors.centerCoords);

    AgRadiusPro.els.radiusDisplay =
        document.getElementById(selectors.radiusDisplay);

    AgRadiusPro.els.locateBtn =
        document.getElementById(selectors.locateBtn);

}

/* =====================================
   SAFE DEFAULT DISPLAY
===================================== */

function setSafeDefaults(){

    if(AgRadiusPro.els.gpsStatus){

        AgRadiusPro.els.gpsStatus.textContent = "Ready";

    }

    if(AgRadiusPro.els.centerCoords){

        AgRadiusPro.els.centerCoords.textContent = "Waiting for GPS";

    }

    if(AgRadiusPro.els.radiusDisplay){

        AgRadiusPro.els.radiusDisplay.textContent =
            `${AgRadiusPro.config.radiusMiles} Air Miles`;

    }

}

/* =====================================
   MODULE LOADING
===================================== */

async function loadModules(){

    AgRadiusPro.modules.ui =
        await safeImport("ui", "./ui.js");

    AgRadiusPro.modules.radius =
        await safeImport("radius", "./radius.js");

    AgRadiusPro.modules.map =
        await safeImport("map", "./map.js");

    AgRadiusPro.modules.gps =
        await safeImport("gps", "./gps.js");

    AgRadiusPro.modules.loves =
        await safeImport("loves", "./loves.js");

    AgRadiusPro.modules.install =
        await safeImport("install", "./install.js");

}

async function safeImport(name, path){

    try{

        const module = await import(path);

        console.log(`Loaded module: ${name}`);

        return module;

    }catch(error){

        console.warn(`Module not loaded: ${name}`, error);

        return {};

    }

}

/* =====================================
   MODULE INITIALIZATION
===================================== */

async function initializeModules(){

    await callModuleInit(
        "ui",
        [
            "initUI",
            "init"
        ]
    );

    await callModuleInit(
        "radius",
        [
            "initRadius",
            "init"
        ]
    );

    await callModuleInit(
        "map",
        [
            "initMap",
            "init"
        ]
    );

    await callModuleInit(
        "gps",
        [
            "initGPS",
            "init"
        ]
    );

    await callModuleInit(
        "loves",
        [
            "initLoves",
            "init"
        ]
    );

    await callModuleInit(
        "install",
        [
            "initInstall",
            "init"
        ]
    );

}

async function callModuleInit(moduleName, possibleFunctionNames){

    const module = AgRadiusPro.modules[moduleName];

    if(!module){

        return;

    }

    for(const functionName of possibleFunctionNames){

        if(typeof module[functionName] === "function"){

            try{

                await module[functionName](AgRadiusPro);

                console.log(`Initialized module: ${moduleName}`);

                return;

            }catch(error){

                console.error(
                    `Failed to initialize module: ${moduleName}`,
                    error
                );

                return;

            }

        }

    }

}

/* =====================================
   GLOBAL BUTTONS
===================================== */

function connectGlobalButtons(){

    if(AgRadiusPro.els.locateBtn){

        AgRadiusPro.els.locateBtn.addEventListener("click", () => {

            locateUser();

        });

    }

}

/* =====================================
   GPS STARTER
===================================== */

async function locateUser(){

    const gpsModule = AgRadiusPro.modules.gps;

    if(gpsModule && typeof gpsModule.locateUser === "function"){

        gpsModule.locateUser(AgRadiusPro);

        return;

    }

    fallbackLocateUser();

}

/* =====================================
   FALLBACK GPS
   This keeps the button working even if gps.js
   is not finished yet.
===================================== */

function fallbackLocateUser(){

    if(!navigator.geolocation){

        updateGpsStatusFallback("GPS Not Supported");

        alert("GPS is not supported on this device or browser.");

        return;

    }

    updateGpsStatusFallback("Locating...");

    navigator.geolocation.getCurrentPosition(
        position => {

            const lat = position.coords.latitude;

            const lng = position.coords.longitude;

            const accuracy = position.coords.accuracy;

            AgRadiusPro.state.currentCenter = {
                lat,
                lng
            };

            AgRadiusPro.state.currentAccuracy = accuracy;

            updateGpsStatusFallback("Active");

            updateCenterFallback(lat, lng);

            updateMapFallback(lat, lng);

        },
        error => {

            console.warn("GPS error:", error);

            let message = "GPS Error";

            if(error.code === error.PERMISSION_DENIED){

                message = "GPS Denied";

            }

            if(error.code === error.POSITION_UNAVAILABLE){

                message = "GPS Unavailable";

            }

            if(error.code === error.TIMEOUT){

                message = "GPS Timeout";

            }

            updateGpsStatusFallback(message);

        },
        AgRadiusPro.config.gps
    );

}

/* =====================================
   FALLBACK UI
===================================== */

function updateGpsStatusFallback(text){

    if(AgRadiusPro.els.gpsStatus){

        AgRadiusPro.els.gpsStatus.textContent = text;

    }

}

function updateCenterFallback(lat, lng){

    if(AgRadiusPro.els.centerCoords){

        AgRadiusPro.els.centerCoords.textContent =
            `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    }

}

/* =====================================
   FALLBACK MAP UPDATE
===================================== */

function updateMapFallback(lat, lng){

    const mapModule = AgRadiusPro.modules.map;

    if(mapModule && typeof mapModule.setMapCenter === "function"){

        mapModule.setMapCenter(
            AgRadiusPro,
            lat,
            lng
        );

    }

}

/* =====================================
   SIMPLE EVENT BUS
===================================== */

AgRadiusPro.events.on = function(eventName, callback){

    if(!AgRadiusPro.events[eventName]){

        AgRadiusPro.events[eventName] = [];

    }

    AgRadiusPro.events[eventName].push(callback);

};

AgRadiusPro.events.emit = function(eventName, payload){

    if(!AgRadiusPro.events[eventName]){

        return;

    }

    AgRadiusPro.events[eventName].forEach(callback => {

        try{

            callback(payload);

        }catch(error){

            console.error(
                `Event error: ${eventName}`,
                error
            );

        }

    });

};

/* =====================================
   PUBLIC HELPERS
===================================== */

AgRadiusPro.locateUser = locateUser;

AgRadiusPro.refreshElements = cacheElements;

AgRadiusPro.setSafeDefaults = setSafeDefaults;
