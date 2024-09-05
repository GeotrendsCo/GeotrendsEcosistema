let layersConfig = {}; // Variable para almacenar la configuración de capas
let ortofotoLayer; // Variable para almacenar la capa de ortofoto

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

// Función para formatear números a dos decimales
function formatNumber(value) {
    return parseFloat(value).toFixed(2);
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

// Función para obtener el color basado en el valor
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

// Función para configurar la barra de color
function setColorBar(divId) {
    var div = document.getElementById(divId);
    const grades = [0, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
    div.innerHTML = "<p><strong>Nivel de presión sonora LAeq [dB]</strong><p>";
    for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i class="colorSingleSquare" style="background:' + getColor(grades[i] + 1) + '"></i> ' +
            grades[i] + "<" + (grades[i + 1] ? '...&le;' + grades[i + 1] + '<br>' : '+');
    }
}

setColorBar("colorBar");

// Inicializar la capa de ortofoto
// function initializeOrtofotoLayer() {
//     ortofotoLayer = L.tileLayer('../output/tiles/{z}/{x}/{y}.png', {
//         maxZoom: 22,
//         attribution: 'Tu Atribución',
//         tms: true,
//         opacity: 1 // Ajustar la opacidad de la capa de ortofoto
//     });
// }

// Cargar la configuración de capas antes de inicializar el contenido
document.addEventListener('DOMContentLoaded', () => {
    loadLayersConfig().then(() => {
        //initializeOrtofotoLayer();
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

                // Añadir la opción de quitar mapa de ruido
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

        fetch('http://localhost:3000/layersM')
            .then(response => response.json())
            .then(layers => {
                const layersContainer = document.getElementById('layers-container2');
                layers.forEach(layer => {
                    const layerItem = document.createElement('li');
                    layerItem.className = 'list-group-item layer-item2';
                    layerItem.textContent = getLayerName('mediciones', layer);
                    layerItem.addEventListener('click', () => {
                        toggleLayer2(layer, layerItem);
                    });
                    layersContainer.appendChild(layerItem);
                });
            })
            .catch(error => {
                console.error('Error fetching layers:', error);
            });

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
    });
});

function selectLayer(layer) {
    // Cambiar el estilo del elemento seleccionado
    const layerItems = document.querySelectorAll('.layer-item');
    layerItems.forEach(item => {
        item.classList.remove('active-layer');
    });

    const selectedItem = [...layerItems].find(item => item.textContent === getLayerName('ruido', layer));
    selectedItem.classList.add('active-layer');

    // Desactivar todas las capas de superposición
    disableAllOverlays();

    // Obtener y desplegar los polígonos en el mapa
    fetch(`http://localhost:3000/polygons/${layer}`)
        .then(response => response.json())
        .then(geojson => {
            displayPolygons(geojson, 'ruido', layer);
        })
        .catch(error => {
            console.error('Error fetching polygons:', error);
        });
}


function toggleLayer2(layer, layerItem) {
    if (layerItem.classList.contains('active-layer')) {
        // Desactivar la capa
        layerItem.classList.remove('active-layer');
        removeMeasurementLayer(layer);
    } else {
        // Activar la capa
        layerItem.classList.add('active-layer');
        fetch(`http://localhost:3000/polygonsM/${layer}`)
            .then(response => response.json())
            .then(geojson => {
                displayPolygons2(geojson, 'mediciones', layer);
                bringShpBaseLayersToFront(); // Traer las capas shp_base al frente después de activar una nueva capa
            })
            .catch(error => {
                console.error('Error fetching polygons:', error);
            });
    }
}

function toggleLayer3(layer, layerItem) {
    if (layerItem.classList.contains('active-layer')) {
        // Desactivar la capa
        layerItem.classList.remove('active-layer');
        removeMeasurementLayer(layer);
    } else {
        // Activar la capa
        layerItem.classList.add('active-layer');
        fetch(`http://localhost:3000/polygonsF/${layer}`)
            .then(response => response.json())
            .then(geojson => {
                displayPolygons3(geojson, 'controles', layer);
                bringShpBaseLayersToFront(); // Traer las capas shp_base al frente después de activar una nueva capa
            })
            .catch(error => {
                console.error('Error fetching polygons:', error);
            });
    }
}

function fadeOutLayer(layer, callback) {
    let opacity = 1;
    const fadeDuration = 500; // Duración total de la transición en milisegundos
    const fadeSteps = 10; // Número de pasos en la transición
    const fadeInterval = fadeDuration / fadeSteps; // Intervalo de tiempo en cada paso
    const fadeOpacityStep = opacity / fadeSteps; // Cantidad de opacidad que se resta en cada paso

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

function addNewLayer(geojson, type, layerName) {
    window.geoJsonLayer = L.geoJSON(geojson, {
        style: function (feature) {
            var isovalue = feature.properties.ISOVALUE ? feature.properties.ISOVALUE : feature.properties.isovalue;
            return {
                fillColor: getColor(isovalue),
                color: getColor(isovalue),
                fillOpacity: 0, // Comenzar con fillOpacity 0
                opacity: 0 // Comenzar con opacity 0
            };
        },
        onEachFeature: function (feature, layer) {
            const popupContent = getPopupContent(type, layerName, feature.properties);
            layer.bindPopup(popupContent, { className: `popup-${type}` });
        }
    }).addTo(map);

    // // Añadir la capa de ortofoto con transparencia
    // if (!map.hasLayer(ortofotoLayer)) {
    //     ortofotoLayer.addTo(map);
    // }

    let opacity = 0;
    const fadeDuration = 500; // Duración total de la transición en milisegundos
    const fadeSteps = 10; // Número de pasos en la transición
    const fadeInterval = fadeDuration / fadeSteps; // Intervalo de tiempo en cada paso
    const fadeOpacityStep = 0.7 / fadeSteps; // Cantidad de opacidad que se suma en cada paso

    const interval = setInterval(() => {
        opacity += fadeOpacityStep;
        if (opacity >= 0.7) {
            clearInterval(interval);
            // Reactivar todas las capas de superposición una vez que la nueva capa esté completamente desplegada
            enableAllOverlays();
        } else {
            window.geoJsonLayer.eachLayer(layer => {
                layer.setStyle({ opacity: opacity, fillOpacity: opacity });
            });
        }
    }, fadeInterval);

    bringShpBaseLayersToFront(); // Asegurarse de que las capas shp_base se traigan al frente después de agregar una nueva capa
}

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

    bringShpBaseLayersToFront(); // Asegurarse de que las capas shp_base se traigan al frente después de agregar una nueva capa
}

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
            iconSize: [41, 41], // Ajusta el tamaño del icono según sea necesario
            shadowSize: [41, 41], // Ajusta el tamaño de la sombra según sea necesario
            iconAnchor: [20, 41], // Ajusta el ancla del icono según sea necesario
            shadowAnchor: [20, 41], // Ajusta el ancla de la sombra según sea necesario
            popupAnchor: [1, -34] // Ajusta el ancla del popup según sea necesario
        });
    }
    return null;
}