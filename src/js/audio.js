import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram.esm.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import Plotly from 'plotly.js-dist-min';

document.addEventListener('DOMContentLoaded', async function() {
    const waveformContainer = document.getElementById('waveform');
    const playButton = document.getElementById('play-button');
    const marcasTable = document.getElementById('marcasTable');
    const medTable = document.getElementById('medTable');
    const loopCheckbox = document.getElementById('loop-checkbox');
    let waveSurfer;
    let loop = true;

    // if (!waveformContainer) {
    //     console.error('No se encontró el contenedor #waveform');
    //     return;
    // }

    const regions = RegionsPlugin.create();

    waveSurfer = WaveSurfer.create({
        container: waveformContainer,
        waveColor: '#A62317',
        progressColor: '#456173',
        backend: 'MediaElement',
        pixelRatio: 1,
        minPxPerSec: 0,
        height: 128,
        normalize: true,
        plugins: [
            TimelinePlugin.create(),
            regions
        ]
    });

    const etiquetaColores = {
        'Ruido exogeno': '#A6BF8F65',
        'Fauna local': '#A64EBF4B',
        'Paso de vehículo': '#A6F2B872',
        'default': '#A6456173'
    };

    const urlParams = new URLSearchParams(window.location.search);
    const codmed = urlParams.get('codmed');
    const diurnoOn = urlParams.get('diurnoOn');
    const diurnoOff = urlParams.get('diurnoOff');
    const diurnoProcesadoOn = urlParams.get('diurnoProcesadoOn');
    const diurnoSimuladoOn = urlParams.get('diurnoSimuladoOn');
    const nocturnoOn = urlParams.get('nocturnoOn');
    const nocturnoOff = urlParams.get('nocturnoOff');
    const nocturnoProcesadoOn = urlParams.get('nocturnoProcesadoOn');
    const nocturnoSimuladoOn = urlParams.get('nocturnoSimuladoOn');

    if (codmed) {
        loadChartDataAndAudio(codmed, diurnoOn, diurnoOff, diurnoProcesadoOn, diurnoSimuladoOn, nocturnoOn, nocturnoOff, nocturnoProcesadoOn, nocturnoSimuladoOn);
    } else {
        console.error('No se encontró el parámetro codmed en la URL.');
    }

    async function loadChartDataAndAudio(codmed, diurnoOn, diurnoOff, diurnoProcesadoOn, diurnoSimuladoOn, nocturnoOn, nocturnoOff, nocturnoProcesadoOn, nocturnoSimuladoOn) {
        try {
            const dataResponse = await fetch(`/api/mediciones/${codmed}`);
            const data = await dataResponse.json();

            if (data.length > 0) {
                const trace = {
                    x: data.map(d => d.tiempo),
                    y: data.map(d => d.laeq),
                    type: 'scatter',
                    mode: 'lines',
                    marker: { color: '#A62317' },
                };

                const marcasResponse = await fetch(`/api/marcas/${codmed}`);
                const marcas = await marcasResponse.json();

                const shapes = marcas.map((marca, index) => ({
                    type: 'rect',
                    xref: 'x',
                    yref: 'paper',
                    x0: marca.inicio_seg,
                    x1: marca.fin_seg,
                    y0: 0,
                    y1: 1,
                    fillcolor: etiquetaColores[marca.etiqueta] || etiquetaColores['default'],
                    line: {
                        width: 0
                    }
                }));

                const layout = {
                    title: `Mediciones de Nivel de Presión Sonora - ${codmed}`,
                    xaxis: {
                        title: 'Tiempo (segundos)',
                        range: [0, Math.max(...data.map(d => d.tiempo))],
                        tickmode: 'linear',
                        tick0: 0,
                        dtick: 500,
                    },
                    yaxis: {
                        title: 'LAeq (dB)',
                        range: [Math.min(...data.map(d => d.laeq)) - 20, Math.max(...data.map(d => d.laeq)) + 10],
                    },
                    shapes: shapes,
                    legend: {
                        x: 1,
                        y: 1,
                        traceorder: 'normal',
                        font: {
                            family: 'Arial, sans-serif',
                            size: 12,
                            color: '#000'
                        },
                        bgcolor: '#E2E2E2',
                        bordercolor: '#FFFFFF',
                        borderwidth: 2
                    },
                    height: 400,
                };

                Plotly.newPlot('plot', [trace], layout);

                waveSurfer.load(`/src/audio/${codmed}_Audio.mp3`);

                waveSurfer.on('decode', () => {
                    marcas.forEach((marca, index) => {
                        regions.addRegion({
                            start: marca.inicio_seg,
                            end: marca.fin_seg,
                            color: etiquetaColores[marca.etiqueta] || etiquetaColores['default'],
                            resize: false,
                            drag: false,
                        });
                    });
                });

                let activeRegion = null;
                regions.on('region-clicked', (region, e) => {
                    e.stopPropagation();
                    activeRegion = region;
                    region.play();
                });

                regions.on('region-out', (region) => {
                    if (activeRegion === region && loop) {
                        region.play();
                    }
                });

                createMarcasTable(marcas);
                createDataSummaryTable(diurnoOn, diurnoOff, diurnoProcesadoOn, diurnoSimuladoOn, nocturnoOn, nocturnoOff, nocturnoProcesadoOn, nocturnoSimuladoOn);

            } else {
                Plotly.newPlot('plot', [], { title: 'No data available for selected codmed' });
            }
        } catch (error) {
            console.error('Error loading chart data or audio:', error);
        }
    }

    // Función para crear la tabla de marcas
    function createMarcasTable(marcas) {
        marcasTable.innerHTML = '';

        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <th>#</th>
            <th>Etiqueta</th>
            <th>Inicio (segundos)</th>
            <th>Fin (segundos)</th>
        `;
        marcasTable.appendChild(headerRow);

        marcas.forEach((marca, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td style="color: ${etiquetaColores[marca.etiqueta] || etiquetaColores['default']}">
                    ${marca.etiqueta}
                </td>
                <td>${marca.inicio}</td>
                <td>${marca.fin}</td>
            `;
            marcasTable.appendChild(row);
        });
    }

    // Nueva función para crear la tabla de resumen con los datos recibidos
    function createDataSummaryTable(diurnoOn, diurnoOff, diurnoProcesadoOn, diurnoSimuladoOn, nocturnoOn, nocturnoOff, nocturnoProcesadoOn, nocturnoSimuladoOn) {
        const tableContainer = document.getElementById("medTable");
        tableContainer.innerHTML = '';  // Limpiar la tabla anterior si la hay

        let tableContent = `
            <thead>
                <tr>
                    <th>Condición</th>
                    <th>Diurno</th>
                    <th>Nocturno</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>On</td>
                    <td>${diurnoOn}</td>
                    <td>${nocturnoOn}</td>
                </tr>
                <tr>
                    <td>Off</td>
                    <td>${diurnoOff}</td>
                    <td>${nocturnoOff}</td>
                </tr>
                <tr>
                    <td>Procesado On</td>
                    <td>${diurnoProcesadoOn}</td>
                    <td>${nocturnoProcesadoOn}</td>
                </tr>
                <tr>
                    <td>Simulado On</td>
                    <td>${diurnoSimuladoOn}</td>
                    <td>${nocturnoSimuladoOn}</td>
                </tr>
            </tbody>`;

        tableContainer.innerHTML = tableContent;
    }

    playButton.addEventListener('click', () => {
        waveSurfer.playPause();
        playButton.textContent = waveSurfer.isPlaying() ? 'Pause' : 'Play';
    });

    loopCheckbox.addEventListener('change', (e) => {
        loop = e.target.checked;
    });

    document.querySelector('input[type="range"]').oninput = (e) => {
        const minPxPerSec = Number(e.target.value);
        waveSurfer.zoom(minPxPerSec);
    };
});
