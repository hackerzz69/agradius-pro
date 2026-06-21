// AgRadius Pro
// GPS Module
// Handles browser GPS location, GPS status, and location watching.

"use strict";

/* =====================================
   INIT
===================================== */

export function initGPS(app){

    if(!app){

        console.warn("GPS module started without app context.");

        return;

    }

    app.gps = {
        locateUser,
        startWatching,
        stopWatching,
        hasGpsSupport,
        getGpsOptions
    };

}

/* =====================================
   GPS SUPPORT
===================================== */

export function hasGpsSupport(){

    return !!navigator.geolocation;

}

function isSecureEnoughForGps(){

    return (
        window.isSecureContext ||
        location.hostname === "localhost" ||
        location.hostname === "127.0.0.1"
    );

}

/* =====================================
   LOCATE USER ONCE
===================================== */

export function locateUser(app){

    if(!hasGpsSupport()){

        handleGpsUnavailable(app);

        return;

    }

    if(!isSecureEnoughForGps()){

        handleGpsInsecure(app);

        return;

    }

    setLocatingUI(app);

    navigator.geolocation.getCurrentPosition(
        position => {

            handleGpsSuccess(
                app,
                position,
                "gps"
            );

        },
        error => {

            handleGpsError(
                app,
                error
            );

        },
        getGpsOptions(app)
    );

}

/* =====================================
   WATCH USER LOCATION
===================================== */

export function startWatching(app){

    if(!hasGpsSupport()){

        handleGpsUnavailable(app);

        return null;

    }

    if(app.state.watchId){

        return app.state.watchId;

    }

    setLocatingUI(app);

    app.state.watchId =
        navigator.geolocation.watchPosition(
            position => {

                handleGpsSuccess(
                    app,
                    position,
                    "gps-watch"
                );

            },
            error => {

                handleGpsError(
                    app,
                    error
                );

            },
            getGpsOptions(app)
        );

    app.state.watching = true;

    return app.state.watchId;

}

export function stopWatching(app){

    if(!app || !app.state){

        return;

    }

    if(app.state.watchId){

        navigator.geolocation.clearWatch(
            app.state.watchId
        );

    }

    app.state.watchId = null;

    app.state.watching = false;

}

/* =====================================
   GPS OPTIONS
===================================== */

export function getGpsOptions(app){

    if(app && app.config && app.config.gps){

        return app.config.gps;

    }

    return {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
    };

}

/* =====================================
   SUCCESS HANDLER
===================================== */

function handleGpsSuccess(app, position, source){

    const lat =
        position.coords.latitude;

    const lng =
        position.coords.longitude;

    const accuracy =
        position.coords.accuracy;

    app.state.currentCenter = {
        lat,
        lng
    };

    app.state.currentAccuracy =
        accuracy;

    setGpsActiveUI(app, lat, lng);

    updateMapCenter(
        app,
        lat,
        lng,
        source
    );

    if(app.events && typeof app.events.emit === "function"){

        app.events.emit(
            "gps:success",
            {
                lat,
                lng,
                accuracy,
                source
            }
        );

    }

}

/* =====================================
   ERROR HANDLER
===================================== */

function handleGpsError(app, error){

    let message =
        "GPS Error";

    if(error.code === error.PERMISSION_DENIED){

        message = "GPS Denied";

    }

    if(error.code === error.POSITION_UNAVAILABLE){

        message = "GPS Unavailable";

    }

    if(error.code === error.TIMEOUT){

        message = "GPS Timeout";

    }

    if(app.ui && typeof app.ui.setGpsStatus === "function"){

        app.ui.setGpsStatus(
            app,
            message,
            "error"
        );

    }

    if(app.ui && typeof app.ui.setLocateButtonLoading === "function"){

        app.ui.setLocateButtonLoading(
            app,
            false
        );

    }

    if(app.ui && typeof app.ui.showToast === "function"){

        app.ui.showToast(
            message,
            "error"
        );

    }

    console.warn("GPS error:", error);

    if(app.events && typeof app.events.emit === "function"){

        app.events.emit(
            "gps:error",
            {
                message,
                error
            }
        );

    }

}

/* =====================================
   UI HELPERS
===================================== */

function setLocatingUI(app){

    if(app.ui && typeof app.ui.setGpsStatus === "function"){

        app.ui.setGpsStatus(
            app,
            "Locating...",
            "loading"
        );

    }

    if(app.ui && typeof app.ui.setLocateButtonLoading === "function"){

        app.ui.setLocateButtonLoading(
            app,
            true
        );

    }

}

function setGpsActiveUI(app, lat, lng){

    if(app.ui && typeof app.ui.setGpsStatus === "function"){

        app.ui.setGpsStatus(
            app,
            "Active",
            "active"
        );

    }

    if(app.ui && typeof app.ui.setCenterCoords === "function"){

        app.ui.setCenterCoords(
            app,
            lat,
            lng
        );

    }

    if(app.ui && typeof app.ui.setLocateButtonLoading === "function"){

        app.ui.setLocateButtonLoading(
            app,
            false
        );

    }

}

function handleGpsUnavailable(app){

    if(app.ui && typeof app.ui.setGpsStatus === "function"){

        app.ui.setGpsStatus(
            app,
            "GPS Not Supported",
            "error"
        );

    }

    if(app.ui && typeof app.ui.showToast === "function"){

        app.ui.showToast(
            "GPS is not supported on this device or browser.",
            "error"
        );

    }else{

        alert("GPS is not supported on this device or browser.");

    }

}

function handleGpsInsecure(app){

    if(app.ui && typeof app.ui.setGpsStatus === "function"){

        app.ui.setGpsStatus(
            app,
            "HTTPS Required",
            "error"
        );

    }

    if(app.ui && typeof app.ui.showToast === "function"){

        app.ui.showToast(
            "GPS requires HTTPS. GitHub Pages should work once published.",
            "error"
        );

    }else{

        alert("GPS requires HTTPS. GitHub Pages should work once published.");

    }

}

/* =====================================
   MAP HELPER
===================================== */

function updateMapCenter(app, lat, lng, source){

    const mapModule =
        app.modules.map;

    if(
        mapModule &&
        typeof mapModule.setMapCenter === "function"
    ){

        mapModule.setMapCenter(
            app,
            lat,
            lng,
            {
                source,
                zoom: app.config.activeZoom
            }
        );

    }

}
