// AgRadius Pro
// Install Module
// Handles PWA install prompt, install button, and service worker registration.

"use strict";

/* =====================================
   INIT
===================================== */

export function initInstall(app){

    if(!app){

        console.warn("Install module started without app context.");

        return;

    }

    app.install = {
        promptInstall,
        registerServiceWorker,
        isInstalled,
        isInstallAvailable,
        refreshInstallButton
    };

    cacheInstallElements(app);

    registerInstallEvents(app);

    bindInstallButton(app);

    registerServiceWorker(app);

    refreshInstallButton(app);

}

/* =====================================
   CACHE ELEMENTS
===================================== */

function cacheInstallElements(app){

    if(!app.els){

        app.els = {};

    }

    app.els.installBtn =
        document.getElementById("installBtn") ||
        document.querySelector("[data-install-btn]") ||
        document.querySelector(".install-btn");

}

/* =====================================
   INSTALL EVENTS
===================================== */

function registerInstallEvents(app){

    window.addEventListener("beforeinstallprompt", event => {

        event.preventDefault();

        app.state.deferredInstallPrompt =
            event;

        refreshInstallButton(app);

        if(app.ui && typeof app.ui.showToast === "function"){

            app.ui.showToast(
                "AgRadius Pro is ready to install.",
                "info"
            );

        }

    });

    window.addEventListener("appinstalled", () => {

        app.state.deferredInstallPrompt =
            null;

        app.state.installed =
            true;

        refreshInstallButton(app);

        if(app.ui && typeof app.ui.showToast === "function"){

            app.ui.showToast(
                "AgRadius Pro installed.",
                "success"
            );

        }

        console.log("AgRadius Pro installed.");

    });

}

/* =====================================
   BUTTON
===================================== */

function bindInstallButton(app){

    if(!app.els.installBtn){

        return;

    }

    app.els.installBtn.addEventListener("click", () => {

        promptInstall(app);

    });

}

export async function promptInstall(app){

    if(isInstalled()){

        if(app.ui && typeof app.ui.showToast === "function"){

            app.ui.showToast(
                "AgRadius Pro is already installed.",
                "info"
            );

        }

        return;

    }

    const promptEvent =
        app.state.deferredInstallPrompt;

    if(!promptEvent){

        if(app.ui && typeof app.ui.showToast === "function"){

            app.ui.showToast(
                "Install is not available yet. Try again after the page finishes loading.",
                "info"
            );

        }

        return;

    }

    promptEvent.prompt();

    const result =
        await promptEvent.userChoice;

    if(result.outcome === "accepted"){

        console.log("User accepted install prompt.");

    }else{

        console.log("User dismissed install prompt.");

    }

    app.state.deferredInstallPrompt =
        null;

    refreshInstallButton(app);

}

/* =====================================
   BUTTON UI
===================================== */

export function refreshInstallButton(app){

    cacheInstallElements(app);

    const button =
        app.els.installBtn;

    if(!button){

        return;

    }

    if(isInstalled()){

        button.hidden = true;

        button.disabled = true;

        button.classList.add("is-installed");

        return;

    }

    if(isInstallAvailable(app)){

        button.hidden = false;

        button.disabled = false;

        button.classList.add("is-ready");

        setInstallButtonText(
            button,
            "Install App"
        );

        return;

    }

    button.hidden = true;

    button.disabled = true;

    button.classList.remove("is-ready");

}

function setInstallButtonText(button, text){

    const span =
        button.querySelector("span");

    if(span){

        span.textContent = text;

        return;

    }

    button.textContent = text;

}

/* =====================================
   INSTALL STATE
===================================== */

export function isInstallAvailable(app){

    return !!(
        app &&
        app.state &&
        app.state.deferredInstallPrompt
    );

}

export function isInstalled(){

    const standaloneDisplay =
        window.matchMedia &&
        window.matchMedia("(display-mode: standalone)").matches;

    const iosStandalone =
        window.navigator.standalone === true;

    return standaloneDisplay || iosStandalone;

}

/* =====================================
   SERVICE WORKER
===================================== */

export async function registerServiceWorker(app){

    if(!("serviceWorker" in navigator)){

        console.log("Service workers are not supported.");

        return null;

    }

    const candidates = [
        "sw.js",
        "pwa/sw.js"
    ];

    for(const path of candidates){

        try{

            const registration =
                await navigator.serviceWorker.register(path);

            console.log(
                `Service worker registered: ${path}`,
                registration
            );

            if(app && app.state){

                app.state.serviceWorkerRegistration =
                    registration;

            }

            return registration;

        }catch(error){

            console.warn(
                `Service worker registration failed: ${path}`,
                error
            );

        }

    }

    return null;

}
