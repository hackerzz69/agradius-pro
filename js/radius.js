// AgRadius Pro
// Radius Module
// Handles 150 air-mile radius math, distance checks, and radius state.

"use strict";

/* =====================================
   INIT
===================================== */

export function initRadius(app){

    if(!app){

        console.warn("Radius module started without app context.");

        return;

    }

    const startingRadius =
        Number(app.config.radiusMiles) || 150;

    app.state.radiusMiles =
        startingRadius;

    app.radius = {
        getRadiusMiles,
        setRadiusMiles,
        getRadiusMeters,
        milesToMeters,
        metersToMiles,
        distanceMiles,
        distanceMeters,
        isPointInsideRadius,
        getRadiusCircleOptions
    };

    if(app.ui && typeof app.ui.setRadiusDisplay === "function"){

        app.ui.setRadiusDisplay(
            app,
            startingRadius
        );

    }

}

/* =====================================
   GET / SET RADIUS
===================================== */

export function getRadiusMiles(app){

    if(!app || !app.state){

        return 150;

    }

    return Number(app.state.radiusMiles) || 150;

}

export function setRadiusMiles(app, miles){

    const radiusMiles =
        normalizeRadiusMiles(miles);

    app.state.radiusMiles =
        radiusMiles;

    if(app.ui && typeof app.ui.setRadiusDisplay === "function"){

        app.ui.setRadiusDisplay(
            app,
            radiusMiles
        );

    }

    if(app.modules.map && typeof app.modules.map.updateRadiusCircle === "function"){

        app.modules.map.updateRadiusCircle(app);

    }

    if(app.events && typeof app.events.emit === "function"){

        app.events.emit(
            "radius:changed",
            {
                radiusMiles
            }
        );

    }

    return radiusMiles;

}

export function getRadiusMeters(app){

    const radiusMiles =
        getRadiusMiles(app);

    return milesToMeters(
        app,
        radiusMiles
    );

}

/* =====================================
   CONVERSION
===================================== */

export function milesToMeters(app, miles){

    const metersPerMile =
        getMetersPerMile(app);

    return Number(miles) * metersPerMile;

}

export function metersToMiles(app, meters){

    const metersPerMile =
        getMetersPerMile(app);

    return Number(meters) / metersPerMile;

}

function getMetersPerMile(app){

    if(
        app &&
        app.config &&
        Number(app.config.metersPerMile)
    ){

        return Number(app.config.metersPerMile);

    }

    return 1609.344;

}

/* =====================================
   DISTANCE MATH
===================================== */

export function distanceMiles(lat1, lng1, lat2, lng2){

    const meters =
        distanceMeters(
            lat1,
            lng1,
            lat2,
            lng2
        );

    return meters / 1609.344;

}

export function distanceMeters(lat1, lng1, lat2, lng2){

    const earthRadiusMeters =
        6371008.8;

    const startLat =
        toRadians(lat1);

    const endLat =
        toRadians(lat2);

    const deltaLat =
        toRadians(lat2 - lat1);

    const deltaLng =
        toRadians(lng2 - lng1);

    const a =
        Math.sin(deltaLat / 2) *
        Math.sin(deltaLat / 2) +
        Math.cos(startLat) *
        Math.cos(endLat) *
        Math.sin(deltaLng / 2) *
        Math.sin(deltaLng / 2);

    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return earthRadiusMeters * c;

}

function toRadians(degrees){

    return degrees * Math.PI / 180;

}

/* =====================================
   RADIUS CHECKS
===================================== */

export function isPointInsideRadius(app, point){

    if(!app || !app.state || !app.state.currentCenter){

        return false;

    }

    if(!point){

        return false;

    }

    const center =
        app.state.currentCenter;

    const pointLat =
        Number(point.lat);

    const pointLng =
        Number(point.lng);

    if(
        Number.isNaN(pointLat) ||
        Number.isNaN(pointLng)
    ){

        return false;

    }

    const miles =
        distanceMiles(
            center.lat,
            center.lng,
            pointLat,
            pointLng
        );

    return miles <= getRadiusMiles(app);

}

export function getDistanceFromCenter(app, point){

    if(!app || !app.state || !app.state.currentCenter){

        return null;

    }

    if(!point){

        return null;

    }

    const center =
        app.state.currentCenter;

    return distanceMiles(
        center.lat,
        center.lng,
        Number(point.lat),
        Number(point.lng)
    );

}

/* =====================================
   LEAFLET CIRCLE OPTIONS
===================================== */

export function getRadiusCircleOptions(){

    return {
        color: "#37F5D6",
        weight: 2,
        opacity: 0.9,
        fillColor: "#37F5D6",
        fillOpacity: 0.12,
        dashArray: "8 10"
    };

}

/* =====================================
   VALIDATION
===================================== */

function normalizeRadiusMiles(miles){

    let value =
        Number(miles);

    if(Number.isNaN(value)){

        value = 150;

    }

    if(value < 1){

        value = 1;

    }

    if(value > 500){

        value = 500;

    }

    return Math.round(value);

}
