import { Viewer, utils } from '@photo-sphere-viewer/core';
import '@photo-sphere-viewer/core/index.css';
import { AutorotatePlugin } from '@photo-sphere-viewer/autorotate-plugin';
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';
import '@photo-sphere-viewer/virtual-tour-plugin/index.css';
import { GalleryPlugin } from '@photo-sphere-viewer/gallery-plugin';
import '@photo-sphere-viewer/gallery-plugin/index.css';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import '@photo-sphere-viewer/markers-plugin/index.css';
import { PlanPlugin } from '@photo-sphere-viewer/plan-plugin';
import '@photo-sphere-viewer/plan-plugin/index.css';
import { TileLayer } from 'leaflet';

const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';
const caption = 'Promigas - Filadelfia <b>&copy; Geotrends SAS</b>';

const animatedValues = {
    pitch: { start: -Math.PI / 2, end: 0 },
    yaw: { start: Math.PI / 2, end: 0 },
    zoom: { start: 0, end: 50 },
    maxFov: { start: 130, end: 90 },
    fisheye: { start: 2, end: 0 },
};

let viewer;
let autorotate;
let isInit = true;

async function fetchData(deploymentId) {
    const response = await fetch(`http://localhost:3000/deployments/${deploymentId}/nodes`);
    const data = await response.json();
    return data;
}

async function initializeViewer(deploymentId, companyId, projectId) {
    const nodes = await fetchData(deploymentId);
    viewer = new Viewer({
        container: 'viewer',
        loadingImg: '/public/icons/Logo_2.png',
        touchmoveTwoFingers: true,
        mousewheelCtrlKey: true,
        defaultYaw: '130deg',
        defaultPitch: animatedValues.pitch.start,
        defaultYaw: animatedValues.yaw.start,
        defaultZoomLvl: animatedValues.zoom.start,
        maxFov: animatedValues.maxFov.start,
        fisheye: animatedValues.fisheye.start,
        mousemove: false, // Deshabilitar interacción al iniciar
        mousewheel: false, // Deshabilitar interacción al iniciar
        navbar: [
            'zoom',
            {
                title: 'Rerun animation',
                content: '🔄',
                onClick: reset,
            },
            'move',
            'caption',
            'fullscreen',
        ],
        plugins: [
            [AutorotatePlugin, {
                autostartDelay: null,
                autostartOnIdle: false,
                autorotatePitch: 0,
            }],
            [MarkersPlugin, {
                // list of markers
                markers: [
                    {
                        // image marker that opens the panel when clicked
                        id: 'image',
                        position: { yaw: 0.32, pitch: 0.11 },
                        image: baseUrl + 'public/icons/pin-red.png',
                        size: { width: 22, height: 22 },
                        anchor: 'bottom center',
                        zoomLvl: 100,
                        tooltip: 'A image marker. <b>Click me!</b>',
                        
                    },
                    {
                        // image marker rendered in the 3D scene
                        id: 'imageLayer',
                        imageLayer: baseUrl + 'pictos/tent.png',
                        size: { width: 120, height: 94 },
                        position: { yaw: -0.45, pitch: -0.1 },
                        tooltip: 'Image embedded in the scene',
                    },
                    {
                        // html marker with custom style
                        id: 'text',
                        position: { yaw: 0, pitch: 0 },
                        html: 'HTML <b>marker</b> &hearts;',
                        anchor: 'bottom right',
                        scale: [0.5, 1.5],
                        style: {
                            maxWidth: '100px',
                            color: 'white',
                            fontSize: '20px',
                            fontFamily: 'Helvetica, sans-serif',
                            textAlign: 'center',
                        },
                        tooltip: {
                            content: 'An HTML marker',
                            position: 'right',
                        },
                    },
                    {
                        // polygon marker
                        id: 'polygon',
                        polygon: [
                            [6.2208, 0.0906],  [0.0443, 0.1028],  [0.2322, 0.0849], [0.4531, 0.0387],
                            [0.5022, -0.0056], [0.4587, -0.0396], [0.252, -0.0453], [0.0434, -0.0575],
                            [6.1302, -0.0623], [6.0094, -0.0169], [6.0471, 0.0320], [6.2208, 0.0906],
                        ],
                        svgStyle: {
                            fill: 'rgba(200, 0, 0, 0.2)',
                            stroke: 'rgba(200, 0, 50, 0.8)',
                            strokeWidth: '2px',
                        },
                        tooltip: {
                            content: 'A dynamic polygon marker',
                            position: 'bottom right',
                        },
                    },
                    {
                        // polyline marker
                        id: 'polyline',
                        polylinePixels: [
                            [2478, 1635], [2184, 1747], [1674, 1953], [1166, 1852],
                            [709, 1669], [301, 1519], [94, 1399], [34, 1356],
                        ],
                        svgStyle: {
                            stroke: 'rgba(140, 190, 10, 0.8)',
                            strokeLinecap: 'round',
                            strokeLinejoin: 'round',
                            strokeWidth: '10px',
                        },
                        tooltip: 'A dynamic polyline marker',
                    },
                    {
                        // circle marker
                        id: 'circle',
                        circle: 5,
                        position: { textureX: 2500, textureY: 1200 },
                        tooltip: 'A circle marker',
                    },
                ],
            }],
            [GalleryPlugin, {
                thumbnailSize: { width: 100, height: 100 },
            }],
            [VirtualTourPlugin, {
                positionMode: 'gps',
                renderMode: '3d',
            }],
            [PlanPlugin, {
                defaultZoom: 18,
                coordinates: [ -75.37660980000001,10.48218069624336],
                bearing: '120deg',
                layers: [

                    {
                        name: 'Esri_WorldImagery',
                        layer: new TileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                            subdomains: ['a', 'b', 'c'],
                            maxZoom: 18,
                        }),
                        attribution: 'Tiles &copy; Esri &mdash; Source: Esri,',
                    },
                    {
                        name: 'OpenStreetMap',
                        urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                        attribution: '&copy; OpenStreetMap',
                    },
                ],
                hotspots: [
                    {
                        coordinates: [6.7783, 44.58506],
                        id: 'green-lake',
                        tooltip: 'Lac vert',
                        color: 'green',
                    },
                ],
            }],
        ],
    });

    autorotate = viewer.getPlugin(AutorotatePlugin);

    const virtualTour = viewer.getPlugin(VirtualTourPlugin);

    const tourNodes = nodes.map(node => ({
        id: node.id,
        panorama: `/images/company${companyId}/project${projectId}/deployment${deploymentId}/${node.panorama}`,
        thumbnail: `/images/company${companyId}/project${projectId}/deployment${deploymentId}/${node.thumbnail}`,
        name: node.name,
        caption: node.caption,
        links: node.links,
        markers: node.markers,
        gps: node.gps,
        panoData: node.panoData
    }));

    console.log(tourNodes)
    virtualTour.setNodes(tourNodes, tourNodes[0].id); // Iniciar el tour en el primer nodo

    // Ejecutar la animación inicial al cargar el visor
    intro(animatedValues.pitch.end, animatedValues.yaw.end);
}

function intro(pitch, yaw) {
    isInit = false;
    autorotate.stop();
    viewer.navbar.hide();

    new utils.Animation({
        properties: {
            ...animatedValues,
            pitch: { start: animatedValues.pitch.start, end: pitch },
            yaw: { start: animatedValues.yaw.start, end: yaw },
        },
        duration: 2500,
        easing: 'inOutQuad',
        onTick: (properties) => {
            viewer.setOptions({
                fisheye: properties.fisheye,
                maxFov: properties.maxFov,
            });
            viewer.rotate({ yaw: properties.yaw, pitch: properties.pitch });
            viewer.zoom(properties.zoom);
        },
    }).then(() => {
        autorotate.start();
        viewer.navbar.show();
        viewer.setOptions({
            mousemove: true, // Habilitar interacción después de la animación
            mousewheel: true, // Habilitar interacción después de la animación
        });
    });
}

function reset() {
    if (!viewer) return; // Verificar si el viewer está definido antes de usarlo
    isInit = true;
    autorotate.stop();
    viewer.setOptions({
        mousemove: false,
        mousewheel: false,
    });

    new utils.Animation({
        properties: {
            pitch: { start: viewer.getPosition().pitch, end: animatedValues.pitch.start },
            yaw: { start: viewer.getPosition().yaw, end: animatedValues.yaw.start },
            zoom: { start: viewer.getZoomLevel(), end: animatedValues.zoom.start },
            maxFov: { start: animatedValues.maxFov.end, end: animatedValues.maxFov.start },
            fisheye: { start: animatedValues.fisheye.end, end: animatedValues.fisheye.start },
        },
        duration: 1500,
        easing: 'inOutQuad',
        onTick: (properties) => {
            viewer.setOptions({
                fisheye: properties.fisheye,
                maxFov: properties.maxFov,
            });
            viewer.rotate({ yaw: properties.yaw, pitch: properties.pitch });
            viewer.zoom(properties.zoom);
        },
    }).then(() => {
        viewer.setOptions({
            mousemove: true, // Habilitar interacción después de la animación
            mousewheel: true, // Habilitar interacción después de la animación
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    const companySelect = document.getElementById('company-select');
    const projectSelect = document.getElementById('project-select');
    const deploymentSelect = document.getElementById('deployment-select');
    const submitButton = document.querySelector('form button');
    
    const companies = await fetch('http://localhost:3000/companies').then(res => res.json());
    companies.forEach(company => {
        const option = document.createElement('option');
        option.value = company.id;
        option.textContent = company.name;
        companySelect.appendChild(option);
    });

    companySelect.addEventListener('change', async () => {
        projectSelect.innerHTML = '<option value="">Seleccione un proyecto</option>';
        deploymentSelect.innerHTML = '<option value="">Seleccione un despliegue</option>';
        projectSelect.disabled = true;
        deploymentSelect.disabled = true;
        submitButton.disabled = true;

        const companyId = companySelect.value;
        if (!companyId) return;

        const projects = await fetch(`http://localhost:3000/companies/${companyId}/projects`).then(res => res.json());
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project.id;
            option.textContent = project.name;
            projectSelect.appendChild(option);
        });
        projectSelect.disabled = false;
    });

    projectSelect.addEventListener('change', async () => {
        deploymentSelect.innerHTML = '<option value="">Seleccione un despliegue</option>';
        deploymentSelect.disabled = true;
        submitButton.disabled = true;

        const projectId = projectSelect.value;
        if (!projectId) return;

        const deployments = await fetch(`http://localhost:3000/projects/${projectId}/deployments`).then(res => res.json());
        deployments.forEach(deployment => {
            const option = document.createElement('option');
            option.value = deployment.id;
            option.textContent = deployment.name;
            deploymentSelect.appendChild(option);
        });
        deploymentSelect.disabled = false;
    });

    deploymentSelect.addEventListener('change', () => {
        submitButton.disabled = !deploymentSelect.value;
    });

    document.getElementById('selection-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const companyId = companySelect.value;
        const projectId = projectSelect.value;
        const deploymentId = deploymentSelect.value;
        if (!deploymentId) return;

        initializeViewer(deploymentId, companyId, projectId);
    });
});
