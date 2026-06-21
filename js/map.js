// AgRadius Pro
// Map Module
// Handles Leaflet map setup, center marker, and 150 air-mile radius circle.

"use strict";

/* =====================================
   INIT
===================================== */

export function initMap(app){

    if(!app){

        console.warn("Map module started without app context.");

        return;

    }

    if(!app.els || !app.els.map){

        console.log("Map element not found yet. Skipping map init.");

        return;

    }

    if(typeof L === "undefined"){

        console.warn("Leaflet is not loaded.");

        return;

    }

    const map =
        L.map(app.els.map, {
            zoomControl: true,
            attributionControl: true
        });

    app.state.map = map;

    setupTileLayers(app);

    setupGeocoder(app);

    setInitialMapView(app);

    app.map = {
        setMapCenter,
        updateRadiusCircle,
        updateCenterMarker,
        invalidateMap,
        getMap
    };

    window.setTimeout(() => {

        invalidateMap(app);

    }, 250);

}

/* =====================================
   TILE LAYERS
===================================== */

function setupTileLayers(app){

    const map =
        app.state.map;

    if(!map){

        return;

    }

    const darkMap =
        L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            {
                maxZoom: 20,
                attribution:
                    "&copy; OpenStreetMap &copy; CARTO"
            }
        );

    const roadMap =
        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,
                attribution:
                    "&copy; OpenStreetMap"
            }
        );

    const satelliteMap =
        L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            {
                maxZoom: 19,
                attribution:
                    "Tiles &copy; Esri"
            }
        );

    darkMap.addTo(map);

    app.state.tileLayers = {
        darkMap,
        roadMap,
        satelliteMap
    };

    L.control.layers(
        {
            "Dark Map": darkMap,
            "Road Map": roadMap,
            "Satellite": satelliteMap
        },
        {},
        {
            position: "topright",
            collapsed: true
        }
    ).addTo(map);

}

/* =====================================
   INITIAL VIEW
===================================== */

function setInitialMapView(app){

    const map =
        app.state.map;

    if(!map){

        return;

    }

    map.setView(
        app.config.defaultCenter,
        app.config.defaultZoom
    );

}

/* =====================================
   GEOCODER
===================================== */

function setupGeocoder(app){

    const map =
        app.state.map;

    if(!map){

        return;

    }

    if(
        typeof L.Control === "undefined" ||
        typeof L.Control.geocoder !== "function"
    ){

        console.log("Leaflet geocoder not loaded.");

        return;

    }

    L.Control.geocoder({
        defaultMarkGeocode: false,
        placeholder: "Search city, address, or location"
    })
    .on("markgeocode", event => {

        const center =
            event.geocode.center;

        setMapCenter(
            app,
            center.lat,
            center.lng,
            {
                zoom: app.config.activeZoom,
                source: "manual"
            }
        );

        if(app.ui && typeof app.ui.setGpsStatus === "function"){

            app.ui.setGpsStatus(
                app,
                "Manual Center",
                "manual"
            );

        }

    })
    .addTo(map);

}

/* =====================================
   SET MAP CENTER
===================================== */

export function setMapCenter(app, lat, lng, options = {}){

    if(!app || !app.state){

        return;

    }

    const cleanLat =
        Number(lat);

    const cleanLng =
        Number(lng);

    if(
        Number.isNaN(cleanLat) ||
        Number.isNaN(cleanLng)
    ){

        console.warn("Invalid map center:", lat, lng);

        return;

    }

    app.state.currentCenter = {
        lat: cleanLat,
        lng: cleanLng
    };

    updateCenterUI(
        app,
        cleanLat,
        cleanLng
    );

    updateCenterMarker(
        app,
        cleanLat,
        cleanLng
    );

    updateRadiusCircle(app);

    moveMapView(
        app,
        cleanLat,
        cleanLng,
        options
    );

    if(app.events && typeof app.events.emit === "function"){

        app.events.emit(
            "center:changed",
            {
                lat: cleanLat,
                lng: cleanLng,
                source: options.source || "unknown"
            }
        );

    }

}

/* =====================================
   MAP VIEW
===================================== */

function moveMapView(app, lat, lng, options = {}){

    const map =
        app.state.map;

    if(!map){

        return;

    }

    const zoom =
        options.zoom ||
        app.config.activeZoom ||
        8;

    map.setView(
        [
            lat,
            lng
        ],
        zoom,
        {
            animate: true
        }
    );

}

/* =====================================
   CENTER MARKER
===================================== */

export function updateCenterMarker(app, lat, lng){

    const map =
        app.state.map;

    if(!map){

        return;

    }

    const center =
        [
            Number(lat),
            Number(lng)
        ];

    if(app.state.centerMarker){

        app.state.centerMarker.setLatLng(center);

        return;

    }

    const icon =
        createCenterIcon();

    app.state.centerMarker =
        L.marker(
            center,
            {
                title: "Radius Center",
                icon
            }
        )
        .addTo(map)
        .bindPopup(
            createCenterPopup(app)
        );

}

function createCenterIcon(){

    return L.divIcon({
        className: "",
        html:
            `<div class="radius-center-marker"></div>`,
        iconSize:
            [
                34,
                34
            ],
        iconAnchor:
            [
                17,
                17
            ],
        popupAnchor:
            [
                0,
                -18
            ]
    });

}

function createCenterPopup(app){

    const radiusMiles =
        getRadiusMiles(app);

    return `
        <div class="popup-title">
            Radius Center
        </div>

        <div class="popup-meta">
            Agricultural exemption planning center.
        </div>

        <div class="popup-badge">
            ${radiusMiles} Air Miles
        </div>
    `;

}

/* =====================================
   RADIUS CIRCLE
===================================== */

export function updateRadiusCircle(app){

    const map =
        app.state.map;

    const center =
        app.state.currentCenter;

    if(!map || !center){

        return;

    }

    const radiusMeters =
        getRadiusMeters(app);

    const options =
        getRadiusCircleOptions(app);

    const latLng =
        [
            center.lat,
            center.lng
        ];

    if(app.state.radiusCircle){

        app.state.radiusCircle.setLatLng(latLng);

        app.state.radiusCircle.setRadius(radiusMeters);

        app.state.radiusCircle.setStyle(options);

        return;

    }

    app.state.radiusCircle =
        L.circle(
            latLng,
            {
                ...options,
                radius: radiusMeters
            }
        )
        .addTo(map);

}

/* =====================================
   UI HELPERS
===================================== */

function updateCenterUI(app, lat, lng){

    if(app.ui && typeof app.ui.setCenterCoords === "function"){

        app.ui.setCenterCoords(
            app,
            lat,
            lng
        );

        return;

    }

    if(app.els.centerCoords){

        app.els.centerCoords.textContent =
            `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    }

}

/* =====================================
   RADIUS HELPERS
===================================== */

function getRadiusMiles(app){

    if(
        app.radius &&
        typeof app.radius.getRadiusMiles === "function"
    ){

        return app.radius.getRadiusMiles(app);

    }

    return Number(app.state.radiusMiles) || 150;

}

function getRadiusMeters(app){

    if(
        app.radius &&
        typeof app.radius.getRadiusMeters === "function"
    ){

        return app.radius.getRadiusMeters(app);

    }

    const miles =
        getRadiusMiles(app);

    return miles * 1609.344;

}

function getRadiusCircleOptions(app){

    if(
        app.radius &&
        typeof app.radius.getRadiusCircleOptions === "function"
    ){

        return app.radius.getRadiusCircleOptions(app);

    }

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
   PUBLIC MAP HELPERS
===================================== */

export function invalidateMap(app){

    if(!app || !app.state || !app.state.map){

        return;

    }

    app.state.map.invalidateSize();

}

export function getMap(app){

    if(!app || !app.state){

        return null;

    }

    return app.state.map || null;

}
