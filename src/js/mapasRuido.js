let allOverlaysEnabled = false;
const overlayLayers = {};
const activeLayers = new Set();
let ortofoto; // Definir ortofoto a nivel global para referencia en las funciones

function initializeMap() {
    console.log("Inicializando el mapa");

    const googleHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });

    const streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 20,
    });

    ortofoto = L.tileLayer('../output/tiles/{z}/{x}/{y}.png', {
        maxZoom: 22,
        attribution: 'Tu Atribución',
        tms: true
    });

    overlayLayers['Ortofoto'] = ortofoto;

    map = L.map('map', {
        layers: [googleHybrid, ortofoto], // Incluir ortofoto en la configuración inicial del mapa
        center: [11.249983, -73.552175],
        zoom: 19
    });

    const baseLayers = {
        "Google Hybrid": googleHybrid,
        "OSM": streetMap,
    };

    const layersControl = L.control.layers(baseLayers, overlayLayers).addTo(map);

    // Fetch configuration from JSON
    fetch('/json/layersConfig.json')
        .then(response => response.json())
        .then(layerConfig => {
            // Load layer names from the backend
            fetch('http://localhost:3000/layersShpBase')
                .then(response => response.json())
                .then(layerNames => {
                    layerNames.forEach(layerName => {
                        if (layerConfig.shp_base && layerConfig.shp_base[layerName]) {
                            const layerInfo = layerConfig.shp_base[layerName];
                            const layerGroup = L.layerGroup();
                            overlayLayers[layerInfo.name] = layerGroup;
                            layersControl.addOverlay(layerGroup, layerInfo.name);

                            // Event listener for when a layer is toggled
                            map.on('overlayadd', function(event) {
                                if (event.name === layerInfo.name) {
                                    activeLayers.add(layerInfo.name);
                                    fetch(`http://localhost:3000/polygonsShpBase/${layerName}`)
                                        .then(response => response.json())
                                        .then(data => {
                                            const geoJsonLayer = L.geoJSON(data, {
                                                style: layerInfo.style,
                                                onEachFeature: function(feature, layer) {
                                                    if (layerInfo.popupTemplate) {
                                                        let popupContent = layerInfo.popupTemplate;
                                                        for (let key in feature.properties) {
                                                            const regex = new RegExp(`{${key}}`, 'g');
                                                            popupContent = popupContent.replace(regex, feature.properties[key]);
                                                        }
                                                        layer.bindPopup(popupContent);
                                                    }
                                                }
                                            }).addTo(layerGroup);
                                            geoJsonLayer.bringToFront();
                                        })
                                        .catch(error => console.error('Error loading layer data:', error));
                                }
                            });

                            map.on('overlayremove', function(event) {
                                if (event.name === layerInfo.name) {
                                    activeLayers.delete(layerInfo.name);
                                    layerGroup.clearLayers();
                                }
                            });
                        }
                    });
                })
                .catch(error => console.error('Error loading layers from backend:', error));
        })
        .catch(error => console.error('Error loading layer configuration:', error));

    // Add custom control for toggling overlays
    const toggleControl = L.control({ position: 'topright' });
    toggleControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
        div.innerHTML = 'Toggle All Overlays';
        div.style.backgroundColor = 'white';
        div.style.padding = '5px';
        div.style.cursor = 'pointer';
        div.onclick = function() {
            toggleAllOverlays();
        };
        return div;
    };
    toggleControl.addTo(map);
}

function openMapasRuido() {
    console.log("Abriendo Mapas de Ruido");
    openRightSidebar('ruido');
    setTimeout(() => {
        initializeMap();
    }, 300); // Esperar a que el sidebar termine de abrirse
}

// Función para habilitar/deshabilitar todas las capas de overlay, excepto ortofoto
function toggleAllOverlays() {
    allOverlaysEnabled = !allOverlaysEnabled;
    Object.keys(overlayLayers).forEach(layerName => {
        if (layerName !== 'Ortofoto') {
            const layerGroup = overlayLayers[layerName];
            if (allOverlaysEnabled) {
                map.addLayer(layerGroup);
                activeLayers.add(layerName);
            } else {
                map.removeLayer(layerGroup);
                activeLayers.delete(layerName);
            }
        }
    });
}

// Función para desactivar todas las capas de overlay, excepto ortofoto
function disableAllOverlays() {
    Object.keys(overlayLayers).forEach(layerName => {
        if (layerName !== 'Ortofoto') {
            const layerGroup = overlayLayers[layerName];
            map.removeLayer(layerGroup);
        }
    });
}

// Función para activar todas las capas de overlay, excepto ortofoto
function enableAllOverlays() {
    Object.keys(overlayLayers).forEach(layerName => {
        if (layerName !== 'Ortofoto') {
            const layerGroup = overlayLayers[layerName];
            map.addLayer(layerGroup);
        }
    });
}
