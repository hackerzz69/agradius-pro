// AgRadius Pro
// UI Module
// Handles hero text, status display, buttons, and small UI updates.

"use strict";

/* =====================================
   INIT
===================================== */

export function initUI(app){

    if(!app){

        console.warn("UI module started without app context.");

        return;

    }

    refreshUIElements(app);

    setGpsStatus(
        app,
        "Ready",
        "idle"
    );

    setCenterText(
        app,
        "Waiting for GPS"
    );

    setRadiusDisplay(
        app,
        app.config.radiusMiles
    );

    setLocateButtonLoading(
        app,
        false
    );

    app.ui = {
        refreshUIElements,
        setGpsStatus,
        setCenterCoords,
        setCenterText,
        setRadiusDisplay,
        setLocateButtonLoading,
        showToast,
        formatCoords
    };

}

/* =====================================
   ELEMENT CACHE
===================================== */

export function refreshUIElements(app){

    if(!app.els){

        app.els = {};

    }

    const selectors = app.config.selectors;

    app.els.gpsStatus =
        document.getElementById(selectors.gpsStatus);

    app.els.centerCoords =
        document.getElementById(selectors.centerCoords);

    app.els.radiusDisplay =
        document.getElementById(selectors.radiusDisplay);

    app.els.locateBtn =
        document.getElementById(selectors.locateBtn);

    app.els.statusDot =
        document.querySelector(".status-dot");

    app.els.hero =
        document.querySelector(".hero");

}

/* =====================================
   GPS STATUS
===================================== */

export function setGpsStatus(app, text, mode = "idle"){

    if(app.els.gpsStatus){

        app.els.gpsStatus.textContent = text;

        app.els.gpsStatus.dataset.mode = mode;

    }

    if(app.els.statusDot){

        app.els.statusDot.dataset.mode = mode;

        app.els.statusDot.classList.remove(
            "is-idle",
            "is-loading",
            "is-active",
            "is-error",
            "is-manual"
        );

        app.els.statusDot.classList.add(
            `is-${mode}`
        );

    }

}

/* =====================================
   CENTER COORDINATES
===================================== */

export function setCenterCoords(app, lat, lng){

    const text = formatCoords(
        lat,
        lng
    );

    setCenterText(
        app,
        text
    );

}

export function setCenterText(app, text){

    if(!app.els.centerCoords){

        return;

    }

    app.els.centerCoords.textContent = text;

}

/* =====================================
   RADIUS DISPLAY
===================================== */

export function setRadiusDisplay(app, radiusMiles){

    if(!app.els.radiusDisplay){

        return;

    }

    app.els.radiusDisplay.textContent =
        `${radiusMiles} Air Miles`;

}

/* =====================================
   LOCATE BUTTON
===================================== */

export function setLocateButtonLoading(app, isLoading){

    if(!app.els.locateBtn){

        return;

    }

    if(isLoading){

        app.els.locateBtn.disabled = true;

        app.els.locateBtn.classList.add(
            "is-loading"
        );

        const span =
            app.els.locateBtn.querySelector("span");

        if(span){

            span.textContent = "Locating...";

        }else{

            app.els.locateBtn.textContent = "Locating...";

        }

        return;

    }

    app.els.locateBtn.disabled = false;

    app.els.locateBtn.classList.remove(
        "is-loading"
    );

    const span =
        app.els.locateBtn.querySelector("span");

    if(span){

        span.textContent = "My Location";

    }

}

/* =====================================
   TOASTS
===================================== */

export function showToast(message, type = "info"){

    let toast =
        document.querySelector(".app-toast");

    if(!toast){

        toast =
            document.createElement("div");

        toast.className = "app-toast";

        document.body.appendChild(toast);

    }

    toast.textContent = message;

    toast.dataset.type = type;

    toast.classList.add("is-visible");

    window.clearTimeout(
        toast._hideTimer
    );

    toast._hideTimer =
        window.setTimeout(() => {

            toast.classList.remove("is-visible");

        }, 2600);

}

/* =====================================
   FORMAT HELPERS
===================================== */

export function formatCoords(lat, lng){

    if(
        typeof lat !== "number" ||
        typeof lng !== "number"
    ){

        return "Waiting for GPS";

    }

    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

}

export function formatMiles(value){

    const number =
        Number(value);

    if(Number.isNaN(number)){

        return "0 Air Miles";

    }

    return `${number} Air Miles`;

}
