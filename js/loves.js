// AgRadius Pro
// Love's Module
// Loads Love's Travel Stops JSON data and places markers on the Leaflet map.

"use strict";

/* =====================================
   INIT
===================================== */

export async function initLoves(app){

    if(!app){

        console.warn("Love's module started without app context.");

        return;

    }

    app.loves = {
        loadLoves,
        renderLoveMarkers,
        clearLoveMarkers,
        refreshLoveRadiusDistances,
        normalizeLoveLocation
    };

    if(app.events && typeof app.events.on === "function"){

        app.events.on("center:changed", () => {

            refreshLoveRadiusDistances(app);

        });

        app.events.on("radius:changed", () => {

            refreshLoveRadiusDistances(app);

        });

    }

    await loadLoves(app);

}

/* =====================================
   LOAD DATA
===================================== */

export async function loadLoves(app){

    const url =
        getLovesDataUrl(app);

    try{

        const response =
            await fetch(url);

        if(!response.ok){

            throw new Error(
                `Failed to load Love's data: ${response.status}`
            );

        }

        const json =
            await response.json();

        const rows =
            getRowsFromJson(json);

        const locations =
            rows
                .map(normalizeLoveLocation)
                .filter(Boolean)
                .filter(isTravelStop);

        app.state.loves =
            locations;

        console.log(
            `Loaded Love's locations: ${locations.length}`
        );

        renderLoveMarkers(app);

        return locations;

    }catch(error){

        console.warn("Could not load Love's locations:", error);

        app.state.loves = [];

        return [];

    }

}

function getLovesDataUrl(app){

    if(
        app &&
        app.config &&
        app.config.data &&
        app.config.data.loves
    ){

        return app.config.data.loves;

    }

    return "data/loves_locations_lite.json";

}

function getRowsFromJson(json){

    if(Array.isArray(json)){

        return json;

    }

    if(Array.isArray(json.locations)){

        return json.locations;

    }

    if(Array.isArray(json.data)){

        return json.data;

    }

    if(Array.isArray(json.results)){

        return json.results;

    }

    return [];

}

/* =====================================
   NORMALIZE DATA
===================================== */

export function normalizeLoveLocation(item){

    if(!item){

        return null;

    }

    const lat =
        toNumber(
            firstValue(
                item.lat,
                item.latitude,
                item.Latitude,
                item.LATITUDE
            )
        );

    const lng =
        toNumber(
            firstValue(
                item.lng,
                item.lon,
                item.long,
                item.longitude,
                item.Longitude,
                item.LONGITUDE
            )
        );

    if(
        Number.isNaN(lat) ||
        Number.isNaN(lng)
    ){

        return null;

    }

    const id =
        firstValue(
            item.id,
            item.storeNumber,
            item.StoreNumber,
            item.store_number,
            item.number
        );

    const city =
        cleanString(
            firstValue(
                item.city,
                item.City
            )
        );

    const state =
        cleanString(
            firstValue(
                item.state,
                item.State
            )
        );

    const address =
        cleanString(
            firstValue(
                item.address,
                item.Address,
                item.street,
                item.Street
            )
        );

    const zip =
        cleanString(
            firstValue(
                item.zip,
                item.Zip,
                item.zipCode,
                item.ZipCode
            )
        );

    const highwayOrExit =
        cleanString(
            firstValue(
                item.highwayOrExit,
                item.HighwayOrExit,
                item.exit,
                item.Exit
            )
        );

    const storeType =
        cleanString(
            firstValue(
                item.storeType,
                item.StoreType,
                item.type,
                item.Type
            )
        );

    return {
        id:
            id || "",

        name:
            cleanString(
                firstValue(
                    item.name,
                    item.Name,
                    item.locationName,
                    item.LocationName
                )
            ) || buildDefaultName(id, city, state),

        storeType,

        city,

        state,

        address,

        zip,

        highwayOrExit,

        phone:
            cleanString(
                firstValue(
                    item.phone,
                    item.Phone
                )
            ),

        lat,

        lng,

        parkingSpaces:
            toNumber(
                firstValue(
                    item.parkingSpaces,
                    item.ParkingSpaces,
                    item.parking,
                    item.Parking
                )
            ),

        defLanes:
            toNumber(
                firstValue(
                    item.defLanes,
                    item.DEFLanes,
                    item.def,
                    item.DEF
                )
            ),

        dieselLanes:
            toNumber(
                firstValue(
                    item.dieselLanes,
                    item.DieselLanes,
                    item.truckDieselLanes,
                    item.TruckDieselLanes
                )
            ),

        catScale:
            toBoolean(
                firstValue(
                    item.catScale,
                    item.catscale,
                    item.catscales,
                    item.CATScale,
                    item.CATScales
                )
            ),

        overnightParking:
            toBoolean(
                firstValue(
                    item.overnightParking,
                    item.overnightparking,
                    item.OvernightParking
                )
            ),

        showers:
            toBoolean(
                firstValue(
                    item.showers,
                    item.privateShowers,
                    item.privateshowers,
                    item.PrivateShowers
                )
            ),

        laundry:
            toBoolean(
                firstValue(
                    item.laundry,
                    item.Laundry
                )
            ),

        dogPark:
            toBoolean(
                firstValue(
                    item.dogPark,
                    item.DogPark
                )
            ),

        transflo:
            toBoolean(
                firstValue(
                    item.transflo,
                    item.Transflo
                )
            ),

        wirelessInternet:
            toBoolean(
                firstValue(
                    item.wirelessInternet,
                    item.wirelessinternet,
                    item.WirelessInternet
                )
            ),

        restaurants:
            cleanString(
                firstValue(
                    item.restaurants,
                    item.Restaurants
                )
            ),

        raw:
            item
    };

}

function buildDefaultName(id, city, state){

    if(id){

        return `Love's #${id}`;

    }

    if(city && state){

        return `Love's ${city}, ${state}`;

    }

    return "Love's Travel Stop";

}

function isTravelStop(location){

    if(!location){

        return false;

    }

    if(!location.storeType){

        return true;

    }

    return location.storeType
        .toLowerCase()
        .includes("travel");

}

/* =====================================
   RENDER MARKERS
===================================== */

export function renderLoveMarkers(app){

    if(!app || !app.state){

        return;

    }

    if(!app.state.map){

        console.log("Map not ready. Love's markers skipped for now.");

        return;

    }

    clearLoveMarkers(app);

    const locations =
        app.state.loves || [];

    const layer =
        L.layerGroup();

    const markers =
        [];

    locations.forEach(location => {

        const marker =
            createLoveMarker(
                app,
                location
            );

        if(marker){

            marker.addTo(layer);

            markers.push(marker);

        }

    });

    layer.addTo(app.state.map);

    app.state.loveLayer =
        layer;

    app.state.loveMarkers =
        markers;

    refreshLoveRadiusDistances(app);

}

function createLoveMarker(app, location){

    if(typeof L === "undefined"){

        return null;

    }

    const marker =
        L.marker(
            [
                location.lat,
                location.lng
            ],
            {
                title: location.name,
                icon: createLoveIcon()
            }
        );

    marker.locationData =
        location;

    marker.bindPopup(
        createLovePopup(app, location)
    );

    return marker;

}

function createLoveIcon(){

    return L.divIcon({
        className: "",
        html:
            `
            <div class="custom-marker love-marker">
                <img src="icons/loves.svg" alt="">
            </div>
            `,
        iconSize:
            [
                44,
                44
            ],
        iconAnchor:
            [
                22,
                22
            ],
        popupAnchor:
            [
                0,
                -24
            ]
    });

}

/* =====================================
   CLEAR MARKERS
===================================== */

export function clearLoveMarkers(app){

    if(!app || !app.state){

        return;

    }

    if(app.state.loveLayer && app.state.map){

        app.state.map.removeLayer(
            app.state.loveLayer
        );

    }

    app.state.loveLayer =
        null;

    app.state.loveMarkers =
        [];

}

/* =====================================
   RADIUS REFRESH
===================================== */

export function refreshLoveRadiusDistances(app){

    if(!app || !app.state){

        return;

    }

    const center =
        app.state.currentCenter;

    const markers =
        app.state.loveMarkers || [];

    if(!center || !markers.length){

        return;

    }

    markers.forEach(marker => {

        const location =
            marker.locationData;

        if(!location){

            return;

        }

        const distance =
            getDistanceFromCenter(
                app,
                location
            );

        location.distanceMiles =
            distance;

        location.insideRadius =
            isInsideRadius(
                app,
                distance
            );

        marker.setPopupContent(
            createLovePopup(
                app,
                location
            )
        );

        if(location.insideRadius){

            marker.setOpacity(1);

        }else{

            marker.setOpacity(.38);

        }

    });

}

function getDistanceFromCenter(app, location){

    if(
        app.radius &&
        typeof app.radius.distanceMiles === "function"
    ){

        return app.radius.distanceMiles(
            app.state.currentCenter.lat,
            app.state.currentCenter.lng,
            location.lat,
            location.lng
        );

    }

    return null;

}

function isInsideRadius(app, distance){

    if(distance === null){

        return false;

    }

    const radiusMiles =
        Number(app.state.radiusMiles) || 150;

    return distance <= radiusMiles;

}

/* =====================================
   POPUP HTML
===================================== */

function createLovePopup(app, location){

    const distanceText =
        getDistanceText(location);

    const parkingText =
        location.parkingSpaces && !Number.isNaN(location.parkingSpaces)
            ? `${location.parkingSpaces} truck parking spaces`
            : "Truck parking info unavailable";

    const scaleText =
        location.catScale
            ? "CAT Scale"
            : "Scale info unavailable";

    const amenities =
        buildAmenityList(location);

    return `
        <div class="popup-title">
            ${escapeHtml(location.name)}
        </div>

        <div class="popup-meta">
            ${escapeHtml(location.address)}
            <br>
            ${escapeHtml(location.city)}, ${escapeHtml(location.state)}
            ${location.zip ? escapeHtml(location.zip) : ""}
        </div>

        ${
            location.highwayOrExit
                ? `
                    <div class="popup-meta">
                        ${escapeHtml(location.highwayOrExit)}
                    </div>
                `
                : ""
        }

        <div class="popup-meta">
            ${escapeHtml(parkingText)}
            <br>
            ${escapeHtml(scaleText)}
        </div>

        ${
            amenities
                ? `
                    <div class="popup-meta">
                        ${amenities}
                    </div>
                `
                : ""
        }

        ${
            distanceText
                ? `
                    <div class="popup-badge">
                        ${distanceText}
                    </div>
                `
                : ""
        }
    `;

}

function getDistanceText(location){

    if(
        typeof location.distanceMiles !== "number" ||
        Number.isNaN(location.distanceMiles)
    ){

        return "";

    }

    const rounded =
        Math.round(location.distanceMiles);

    if(location.insideRadius){

        return `${rounded} mi from center · Inside radius`;

    }

    return `${rounded} mi from center · Outside radius`;

}

function buildAmenityList(location){

    const amenities =
        [];

    if(location.overnightParking){

        amenities.push("Overnight Parking");

    }

    if(location.showers){

        amenities.push("Showers");

    }

    if(location.laundry){

        amenities.push("Laundry");

    }

    if(location.dogPark){

        amenities.push("Dog Park");

    }

    if(location.transflo){

        amenities.push("Transflo");

    }

    if(location.wirelessInternet){

        amenities.push("Wi-Fi");

    }

    if(location.restaurants){

        amenities.push(
            escapeHtml(location.restaurants)
        );

    }

    return amenities.join(" · ");

}

/* =====================================
   HELPERS
===================================== */

function firstValue(...values){

    for(const value of values){

        if(
            value !== undefined &&
            value !== null &&
            value !== ""
        ){

            return value;

        }

    }

    return "";

}

function cleanString(value){

    if(
        value === undefined ||
        value === null
    ){

        return "";

    }

    return String(value).trim();

}

function toNumber(value){

    if(
        value === undefined ||
        value === null ||
        value === ""
    ){

        return NaN;

    }

    const number =
        Number(value);

    return number;

}

function toBoolean(value){

    if(value === true){

        return true;

    }

    if(value === false){

        return false;

    }

    if(
        value === undefined ||
        value === null
    ){

        return false;

    }

    const text =
        String(value)
            .trim()
            .toLowerCase();

    return [
        "true",
        "yes",
        "y",
        "1",
        "available",
        "x"
    ].includes(text);

}

function escapeHtml(value){

    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}
