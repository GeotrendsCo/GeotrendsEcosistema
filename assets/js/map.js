var map = L.map('map').setView([4.570868, -74.297333], 6);
var mainLayerGroup = new L.LayerGroup().addTo(map);
let globalData;
let layersConfig = {}; // Configuración de capas
let overlayLayers = {}; // Capas superpuestas
let activeLayers = new Set(); // Conjunto para rastrear capas activas

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
}).addTo(map);

function getColor(d) {
    return d >= 80 ? '#000078' :
        d >= 75 ? '#00c5ff' :
            d >= 70 ? '#ff00ff' :
                d >= 65 ? '#ff1111' :
                    d >= 60 ? '#ff7777' :
                        d >= 55 ? '#ffaa00' :
                            d >= 50 ? '#ffcd69' :
                                d >= 45 ? '#ffff02' :
                                    d >= 40 ? '#007800' :
                                        d >= 35 ? '#c3ff86' :
                                            'transparent';
}

function setMap(data) {
    mainLayerGroup.clearLayers();
    Object.keys(data).forEach((key) => {
        const value = data[key];
        var marker = L.marker(value.coordinates).addTo(mainLayerGroup);
        marker.bindTooltip(key, {
            permanent: false,
            direction: "top"
        });

        marker.on("click", (e) => {
            mainLayerGroup.removeLayer(marker);
            map.flyTo(marker.getLatLng(), 17, {
                duration: 1.5, // Duración de la transición en segundos
                easeLinearity: 0.5 // Suavidad de la transición
            });

            Object.keys(value.points).forEach((key) => {
                var point = value.points[key];
                var marker_point = L.marker(point.coordinates).addTo(mainLayerGroup);
                marker_point.bindTooltip(key, {
                    permanent: false,
                    direction: "top"
                });

                marker_point.on("click", () => {
                    // Verificar si el punto tiene un codmed
                    var codmed = point.codmed ? point.codmed : 'default_value'; // Usa un valor predeterminado si codmed no existe

                    // Extraer otros datos que deseas enviar
                    var diurnoOn = point.diurnoOn || '';
                    var diurnoOff = point.diurnoOff || '';
                    var diurnoProcesadoOn = point.diurnoProcesadoOn || '';
                    var diurnoSimuladoOn = point.diurnoSimuladoOn || '';
                    var nocturnoOn = point.nocturnoOn || '';
                    var nocturnoOff = point.nocturnoOff || '';
                    var nocturnoProcesadoOn = point.nocturnoProcesadoOn || '';
                    var nocturnoSimuladoOn = point.nocturnoSimuladoOn || '';

                    // Construir la URL con los datos adicionales
                    var url = `src/pages/audio?codmed=${codmed}&diurnoOn=${encodeURIComponent(diurnoOn)}&diurnoOff=${encodeURIComponent(diurnoOff)}&diurnoProcesadoOn=${encodeURIComponent(diurnoProcesadoOn)}&diurnoSimuladoOn=${encodeURIComponent(diurnoSimuladoOn)}&nocturnoOn=${encodeURIComponent(nocturnoOn)}&nocturnoOff=${encodeURIComponent(nocturnoOff)}&nocturnoProcesadoOn=${encodeURIComponent(nocturnoProcesadoOn)}&nocturnoSimuladoOn=${encodeURIComponent(nocturnoSimuladoOn)}`;

                    // Insertar el iframe en el modal
                    document.getElementById("markerInfo").innerHTML = `<iframe src="${url}" width="100%" height="400px" frameborder="0" allowfullscreen></iframe>`;

                    var modal = new bootstrap.Modal(document.getElementById('markerModal'));
                    modal.show();
                });

            });
        });

    });
}

// Función para cargar capas asociadas a un proyecto
function loadProjectLayers(projectName) {
    fetch(`/assets/json/layers_${projectName}.json`) // Suponiendo que cada proyecto tiene un archivo de capas específico
        .then(response => response.json())
        .then(layersData => {
            // Aquí se procesan las capas y se añaden al mapa
            layersData.forEach(layer => {
                L.geoJSON(layer, {
                    style: function (feature) {
                        var isovalue = feature.properties.ISOVALUE ? feature.properties.ISOVALUE : feature.properties.isovalue;
                        return {
                            fillColor: getColor(isovalue),
                            color: getColor(isovalue),
                            fillOpacity: 0.7,
                            opacity: 0.7
                        };
                    }
                }).addTo(mainLayerGroup);
            });
        })
        .catch(error => console.error('Error al cargar las capas del proyecto:', error));
}

// Función para cargar capas específicas de un punto
function loadLayersForPoint(codmed) {
    fetch(`/assets/json/layers_${codmed}.json`) // Suponiendo que cada punto puede tener capas específicas
        .then(response => response.json())
        .then(layerData => {
            L.geoJSON(layerData, {
                style: function (feature) {
                    var isovalue = feature.properties.ISOVALUE ? feature.properties.ISOVALUE : feature.properties.isovalue;
                    return {
                        fillColor: getColor(isovalue),
                        color: getColor(isovalue),
                        fillOpacity: 0.7,
                        opacity: 0.7
                    };
                }
            }).addTo(mainLayerGroup);
        })
        .catch(error => console.error('Error al cargar las capas del punto:', error));
}

// Función para cargar el JSON de configuración de capas
function loadLayersConfig() {
    return fetch('/public/json/layersConfig.json')
        .then(response => response.json())
        .then(data => {
            layersConfig = data;
        })
        .catch(error => {
            console.error('Error loading layers configuration:', error);
        });
}

// Función para configurar el control de capas y agregar capas dinámicamente
function setupLayersControl() {
    fetch('http://localhost:3000/layers')
        .then(response => response.json())
        .then(layers => {
            const layersContainer = document.getElementById('layers-container');
            layers.forEach(layer => {
                const layerItem = document.createElement('li');
                layerItem.className = 'list-group-item layer-item';
                layerItem.textContent = getLayerName('ruido', layer);
                layerItem.addEventListener('click', () => {
                    selectLayer(layer);
                });
                layersContainer.appendChild(layerItem);
            });

            const removeMapItem = document.getElementById('remove-map-layer');
            removeMapItem.addEventListener('click', () => {
                if (window.geoJsonLayer) {
                    map.removeLayer(window.geoJsonLayer);
                    window.geoJsonLayer = null;
                }

                const layerItems = document.querySelectorAll('.layer-item');
                layerItems.forEach(item => {
                    item.classList.remove('active-layer');
                });
            });
        })
        .catch(error => {
            console.error('Error fetching layers:', error);
        });

    // fetch('http://localhost:3000/layersM')
    //     .then(response => response.json())
    //     .then(layers => {
    //         const layersContainer = document.getElementById('layers-container2');
    //         layers.forEach(layer => {
    //             const layerItem = document.createElement('li');
    //             layerItem.className = 'list-group-item layer-item2';
    //             layerItem.textContent = getLayerName('mediciones', layer);
    //             layerItem.addEventListener('click', () => {
    //                 toggleLayer2(layer, layerItem);
    //             });
    //             layersContainer.appendChild(layerItem);
    //         });
    //     })
    //     .catch(error => {
    //         console.error('Error fetching layers:', error);
    //     });

    fetch('http://localhost:3000/layersF')
        .then(response => response.json())
        .then(layers => {
            const layersContainer = document.getElementById('layers-container3');
            layers.forEach(layer => {
                const layerItem = document.createElement('li');
                layerItem.className = 'list-group-item layer-item3';
                layerItem.textContent = getLayerName('controles', layer);
                layerItem.addEventListener('click', () => {
                    toggleLayer3(layer, layerItem);
                });
                layersContainer.appendChild(layerItem);
            });
        })
        .catch(error => {
            console.error('Error fetching layers:', error);
        });
}

// Función para seleccionar una capa y desplegar sus polígonos en el mapa
function selectLayer(layer) {
    const layerItems = document.querySelectorAll('.layer-item');
    layerItems.forEach(item => {
        item.classList.remove('active-layer');
    });

    const selectedItem = [...layerItems].find(item => item.textContent === getLayerName('ruido', layer));
    selectedItem.classList.add('active-layer');

    disableAllOverlays();

    fetch(`http://localhost:3000/polygons/${layer}`)
        .then(response => response.json())
        .then(geojson => {
            displayPolygons(geojson, 'ruido', layer);
        })
        .catch(error => {
            console.error('Error fetching polygons:', error);
        });
}

// Función para activar o desactivar una capa de medición
function toggleLayer2(layer, layerItem) {
    if (layerItem.classList.contains('active-layer')) {
        layerItem.classList.remove('active-layer');
        removeMeasurementLayer(layer);
    } else {
        layerItem.classList.add('active-layer');
        fetch(`http://localhost:3000/polygonsM/${layer}`)
            .then(response => response.json())
            .then(geojson => {
                displayPolygons2(geojson, 'mediciones', layer);
                bringShpBaseLayersToFront();
            })
            .catch(error => {
                console.error('Error fetching polygons:', error);
            });
    }
}

// Función para activar o desactivar una capa de control
function toggleLayer3(layer, layerItem) {
    if (layerItem.classList.contains('active-layer')) {
        layerItem.classList.remove('active-layer');
        removeMeasurementLayer(layer);
    } else {
        layerItem.classList.add('active-layer');
        fetch(`http://localhost:3000/polygonsF/${layer}`)
            .then(response => response.json())
            .then(geojson => {
                displayPolygons3(geojson, 'controles', layer);
                bringShpBaseLayersToFront();
            })
            .catch(error => {
                console.error('Error fetching polygons:', error);
            });
    }
}

// Función para obtener el nombre personalizado de una capa
function getLayerName(type, layer) {
    if (layersConfig[type] && layersConfig[type][layer]) {
        return layersConfig[type][layer].name || layer;
    }
    return layer || 'undefined';
}

// Función para obtener el contenido del popup personalizado de una capa
function getPopupContent(type, layer, properties) {
    if (layersConfig[type] && layersConfig[type][layer]) {
        let template = layersConfig[type][layer].popupTemplate || '';
        for (let prop in properties) {
            let value = properties[prop];
            if (!isNaN(value)) {
                value = formatNumber(value); // Formatear números
            }
            template = template.replace(new RegExp(`{${prop}}`, 'g'), value);
        }
        return template;
    }
    let content = '<strong>Propiedades:</strong><br>';
    for (let prop in properties) {
        content += `${prop}: ${properties[prop]}<br>`;
    }
    return content;
}

// Función para formatear números a dos decimales
function formatNumber(value) {
    return parseFloat(value).toFixed(2);
}

// Función para mostrar los polígonos en el mapa
function displayPolygons(geojson, type, layerName) {
    if (typeof map !== 'undefined') {
        if (window.geoJsonLayer) {
            fadeOutLayer(window.geoJsonLayer, () => {
                addNewLayer(geojson, type, layerName);
            });
        } else {
            addNewLayer(geojson, type, layerName);
        }
    } else {
        console.error('Map instance is not defined');
    }
}

function displayPolygons2(geojson, type, layerName) {
    if (typeof map !== 'undefined') {
        addMeasurementLayer(geojson, type, layerName);
    } else {
        console.error('Map instance is not defined');
    }
}

function displayPolygons3(geojson, type, layerName) {
    if (typeof map !== 'undefined') {
        addMeasurementLayer(geojson, type, layerName);
    } else {
        console.error('Map instance is not defined');
    }
}

function fadeOutLayer(layer, callback) {
    let opacity = 1;
    const fadeDuration = 500; // Duración total de la transición en milisegundos
    const fadeSteps = 10;
    const fadeInterval = fadeDuration / fadeSteps;
    const fadeOpacityStep = opacity / fadeSteps;

    const interval = setInterval(() => {
        opacity -= fadeOpacityStep;
        if (opacity <= 0) {
            clearInterval(interval);
            map.removeLayer(layer);
            callback();
        } else {
            layer.eachLayer(layer => {
                layer.setStyle({ opacity: opacity, fillOpacity: opacity });
            });
        }
    }, fadeInterval);
}

function addNewLayer(geojson, type, layerName) {
    window.geoJsonLayer = L.geoJSON(geojson, {
        style: function (feature) {
            var isovalue = feature.properties.ISOVALUE ? feature.properties.ISOVALUE : feature.properties.isovalue;
            return {
                fillColor: getColor(isovalue),
                color: getColor(isovalue),
                fillOpacity: 0,
                opacity: 0
            };
        },
        onEachFeature: function (feature, layer) {
            const popupContent = getPopupContent(type, layerName, feature.properties);
            layer.bindPopup(popupContent, { className: `popup-${type}` });
        }
    }).addTo(map);

    let opacity = 0;
    const fadeDuration = 500;
    const fadeSteps = 10;
    const fadeInterval = fadeDuration / fadeSteps;
    const fadeOpacityStep = 0.7 / fadeSteps;

    const interval = setInterval(() => {
        opacity += fadeOpacityStep;
        if (opacity >= 0.7) {
            clearInterval(interval);
            enableAllOverlays();
        } else {
            window.geoJsonLayer.eachLayer(layer => {
                layer.setStyle({ opacity: opacity, fillOpacity: opacity });
            });
        }
    }, fadeInterval);

    bringShpBaseLayersToFront();
}

// Función para agregar capas de mediciones al mapa
function addMeasurementLayer(geojson, type, layerName) {
    const layerIcon = getLayerIcon(type, layerName);

    const measurementLayer = L.geoJSON(geojson, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, { icon: layerIcon });
        },
        style: function (feature) {
            var isovalue = feature.properties.ISOVALUE ? feature.properties.ISOVALUE : feature.properties.isovalue;
            return {
                fillColor: getColor(isovalue),
                color: getColor(isovalue),
                fillOpacity: 0.7,
                opacity: 0.7
            };
        },
        onEachFeature: function (feature, layer) {
            const popupContent = getPopupContent(type, layerName, feature.properties);
            layer.bindPopup(popupContent, { className: `popup-${type}` });
        }
    }).addTo(map);

    if (!window.measurementLayers) {
        window.measurementLayers = {};
    }
    window.measurementLayers[layerName] = measurementLayer;

    bringShpBaseLayersToFront();
}

// Función para eliminar una capa de mediciones
function removeMeasurementLayer(layerName) {
    if (window.measurementLayers && window.measurementLayers[layerName]) {
        map.removeLayer(window.measurementLayers[layerName]);
        delete window.measurementLayers[layerName];
    }
}

// Función para traer al frente las capas de shp_base
function bringShpBaseLayersToFront() {
    Object.keys(overlayLayers).forEach(layerName => {
        if (layersConfig.shp_base && layersConfig.shp_base[layerName]) {
            overlayLayers[layerName].bringToFront();
        }
    });
}

// Función para obtener el icono personalizado de una capa
function getLayerIcon(type, layer) {
    if (layersConfig[type] && layersConfig[type][layer] && layersConfig[type][layer].iconUrl) {
        return L.icon({
            iconUrl: layersConfig[type][layer].iconUrl,
            shadowUrl: layersConfig[type][layer].shadowUrl,
            iconSize: [41, 41],
            shadowSize: [41, 41],
            iconAnchor: [20, 41],
            shadowAnchor: [20, 41],
            popupAnchor: [1, -34]
        });
    }
    return null;
}

// Función para habilitar todas las capas de overlay
function enableAllOverlays() {
    Object.keys(overlayLayers).forEach(layerName => {
        const layerGroup = overlayLayers[layerName];
        if (!map.hasLayer(layerGroup)) {
            map.addLayer(layerGroup);
        }
    });
}

// Función para deshabilitar todas las capas de overlay
function disableAllOverlays() {
    Object.keys(overlayLayers).forEach(layerName => {
        const layerGroup = overlayLayers[layerName];
        if (map.hasLayer(layerGroup)) {
            map.removeLayer(layerGroup);
        }
    });
}

// Iniciar la funcionalidad del mapa cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    loadLayersConfig().then(() => {
        setupLayersControl();
    });

    fetch('/assets/json/projects.json')
        .then(response => response.json())
        .then(data => {
            setMap(data);
            globalData = data;
        })
        .catch(error => console.error('Error al cargar el JSON de proyectos:', error));
});

map.on("zoom", () => {
    document.getElementById("returnBtn").style.display = "block";
});



var btn = document.getElementById("returnBtn");
btn.addEventListener("click", (e) => {
    map.setView([4.570868, -74.297333], 6);
    btn.style.display = "none";
    setMap(globalData);
});
