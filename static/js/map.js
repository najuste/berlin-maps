
function getDataProjection(data) {
    try {
        if (data.crs && data.crs.properties && data.crs.properties.name) {
            // Extract EPSG code from URN format like "urn:ogc:def:crs:EPSG::25833"
            const match = data.crs.properties.name.match(/EPSG::?(\d+)/);
            if (match) {
                return `EPSG:${match[1]}`;
            }
        }
    } catch (e) {
        return null;
    }
    return null;
}

function isCoordinatesInWGS84(projection) {
    return (projection && projection.includes("4326"));
}

function reprojectCoordinates(coords, source, target) {
    if (typeof coords[0] === "number") {
        return proj4(source, target, coords);
    }
    return coords.map(c => reprojectCoordinates(c, source, target));
}


// project related PROJECTIONS
function reprojectedData(data, sourceProjection) {
    const targetProjection = 'EPSG:4326';
    if (sourceProjection === "EPSG:25833") {
        proj4.defs("EPSG:25833", "+proj=utm +zone=33 +ellps=GRS80 +units=m +no_defs");
    }
    data.features.forEach(feature => {
        feature.geometry.coordinates = reprojectCoordinates(
            feature.geometry.coordinates,
            sourceProjection,
            targetProjection
        );
    });
    return data;
}

// TO DO add fetching storing in localStorage
fetch("/api/data")
    .then(res => res.json())
    .then(data => {
        // TODO cleanup
        console.log('Data', data)

        const sourceProjection = getDataProjection(data);
        if (!isCoordinatesInWGS84(sourceProjection)) {
            // is there a lib to pass proj def automatically
            data = reprojectedData(data, sourceProjection);

        }
        const map = L.map("map").setView([52.52, 13.405], 11);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
            .addTo(map);
        L.geoJSON(data, {
            style: feature => ({
                color: "#333",
                weight: 1,
                fillColor: getColor(feature.properties.inst_leistung),
                fillOpacity: 0.7
            }),
            onEachFeature: (feature, layer) => {
                layer.bindPopup(
                    `<b>${feature.properties.bezirk}</b><br/>` +
                    `Anzahl: ${feature.properties.anzahl}<br/>` +
                    `Leistung: ${feature.properties.inst_leistung} MW`
                );
            }
        }).addTo(map);
        addLegend(map);
    })
    .catch(error => {
        console.error('Error fetching GeoJSON data:', error);
    });

function addLegend(map) {
    const legend = L.control({ position: "topright" });

    legend.onAdd = function () {
        const div = L.DomUtil.create("div", "info legend");
        const colorGrades = [0, 10, 20, 50];
        const labels = [];

        const title = L.DomUtil.create("div", "legend-title", div);
        title.innerHTML = "Solar Installations in Berlin";

        for (let i = 0; i < colorGrades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(colorGrades[i] + 1) + '"></i> ' +
                colorGrades[i] + (colorGrades[i + 1] ? "&ndash;" + colorGrades[i + 1] + " kWh" + "<br>" : "+" + " kWh");
        }

        const attribution = L.DomUtil.create("div", "legend-attribution", div);
        attribution.innerHTML = "<small>Data: GDI Berlin</small>";

        return div;
    };

    legend.addTo(map);
}


function getColor(value) {
    return value > 50 ? "#006837" :
        value > 20 ? "#31a354" :
            value > 10 ? "#78c679" :
                "#c2e699";
}