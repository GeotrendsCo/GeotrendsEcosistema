// server.js
import express from 'express';
import pkg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';

const { Pool } = pkg;

const app = express();
const pool = new Pool({
    user: 'dbmasteruser',
    host: 'ls-801a010ba211ba2e70a772ea9be742cc63bc77c8.c3igyeqqodiz.us-east-1.rds.amazonaws.com',
    database: 'EcoGeotrends',
    password: '3wW0n]om^<jY{A9[e7M^MLL_U_G&Kp8G',
    port: 5432,
    ssl: {
      rejectUnauthorized: false // Cambiar a `true` para producción asegura que se verificarán los certificados.
    }
  });

  // Ruta para obtener la estructura de carpetas e imágenes
// Ruta para obtener la estructura de carpetas e imágenes
// Ruta para obtener la estructura de carpetas e imágenes
app.get('/get-gallery', (req, res) => {
  const baseDir = path.join(__dirname, 'public/registros');  // Cambia la ruta aquí
  const galleryData = {};

  // Asegúrate de que fs.readdirSync se esté utilizando correctamente
  fs.readdirSync(baseDir).forEach(folder => {
    const folderPath = path.join(baseDir, folder);
    if (fs.lstatSync(folderPath).isDirectory()) {
      galleryData[folder] = fs.readdirSync(folderPath).filter(file => {
        return ['.jpg', '.jpeg', '.png', '.gif'].includes(path.extname(file).toLowerCase());
      });
    }
  });

  res.json(galleryData);
});

// Endpoint para obtener todos los codmed
app.get('/api/codmed', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT codmed FROM mediciones.info_data');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching codmeds', error);
    res.status(500).send('Error fetching codmeds');
  }
});

// Endpoint para obtener datos filtrados por codmed
app.get('/api/mediciones/:codmed', async (req, res) => {
  const { codmed } = req.params;
  try {
    const result = await pool.query('SELECT * FROM mediciones.historial_data WHERE codmed = $1', [codmed]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching data', error);
    res.status(500).send('Error fetching data');
  }
});

// Endpoint para obtener las marcas de una medición específica
app.get('/api/marcas/:codmed', async (req, res) => {
  const { codmed } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM mediciones.marcas WHERE codmed = $1',
      [codmed]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching marcas:', err);
    res.status(500).send('Error fetching marcas');
  }
});


// Middleware para manejar JSON
app.use(express.json());

// Middleware para permitir CORS
app.use(cors({
    origin: 'http://44.213.153.17:5173'  // Ajusta esto según sea necesario
}));



// Obtener la ruta del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta para servir imágenes estáticas
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Obtener todas las compañías
app.get('/companies', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM companies');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Obtener todos los proyectos de una compañía
app.get('/companies/:companyId/projects', async (req, res) => {
    const { companyId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM projects WHERE company_id = $1', [companyId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Obtener todos los despliegues de un proyecto
app.get('/projects/:projectId/deployments', async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM deployments WHERE project_id = $1', [projectId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Obtener nodos y sus marcadores
app.get('/deployments/:deploymentId/nodes', async (req, res) => {
    try {
        const { deploymentId } = req.params;

        const nodesResult = await pool.query(`
            SELECT node_id, panorama, thumbnail, name, caption, ST_AsText(gps) as gps, pano_data, markers
            FROM nodes
            WHERE deployment_id = $1
        `, [deploymentId]);

        const markersResult = await pool.query(`
            SELECT node_id, id, image, tooltip, size, anchor, ST_AsText(gps) as gps
            FROM markers
            WHERE deployment_id = $1
        `, [deploymentId]);

        const linksResult = await pool.query(`
            SELECT from_node_id, to_node_id
            FROM links
            WHERE deployment_id = $1
        `, [deploymentId]);

        const markersByNodeId = markersResult.rows.reduce((acc, marker) => {
            const position = parseWKT(marker.gps);
            if (!acc[marker.node_id]) {
                acc[marker.node_id] = [];
            }
            acc[marker.node_id].push({
                id: marker.id,
                image: marker.image,
                tooltip: marker.tooltip,
                size: marker.size,
                anchor: marker.anchor,
                position: position
            });
            return acc;
        }, {});

        const linksByNodeId = linksResult.rows.reduce((acc, link) => {
            if (!acc[link.from_node_id]) {
                acc[link.from_node_id] = [];
            }
            acc[link.from_node_id].push({ nodeId: link.to_node_id });
            return acc;
        }, {});

        const nodes = nodesResult.rows.map(node => ({
            id: node.node_id,
            panorama: node.panorama,
            thumbnail: node.thumbnail,
            name: node.name,
            caption: node.caption,
            gps: parseWKT(node.gps),
            panoData: JSON.parse(node.pano_data || '{}'),
            //markers2: markersByNodeId[node.node_id] || [],
           // markers: node.markers ? JSON.parse(node.markers) : [], // Parseando el JSON de los marcadores
            links: linksByNodeId[node.node_id] || []
        }));

        res.json(nodes);
    } catch (err) {
        console.error('Error ejecutando la consulta', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

function parseWKT(wkt) {
  if (!wkt) {
      console.error('WKT es nulo o indefinido');
      return null;  // Devuelve null si WKT es nulo o indefinido
  }
  const match = wkt.match(/POINT\s*\(\s*([^\s,]+)\s+([^\s,]+)\s*\)/);
  if (match) {
      return [parseFloat(match[1]), parseFloat(match[2])];
  }
  return null;
}


// Endpoint para obtener las capas del esquema "ruido"
app.get('/layers', async (req, res) => {
  try {
    const client = await pool.connect();
    const query = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'ruido';
    `;

    const result = await client.query(query);
    client.release();

    const layers = result.rows.map(row => row.table_name);
    res.json(layers);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint para obtener las capas del esquema "mediciones"
app.get('/layersM', async (req, res) => {
  try {
    const client = await pool.connect();
    const query = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'medicion';
    `;

    const result = await client.query(query);
    client.release();

    const layers = result.rows.map(row => row.table_name);
    res.json(layers);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint para obtener las capas del esquema "fotografias"
app.get('/layersF', async (req, res) => {
  try {
    const client = await pool.connect();
    const query = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'fotografias';
    `;

    const result = await client.query(query);
    client.release();

    const layers = result.rows.map(row => row.table_name);
    res.json(layers);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint para obtener los polígonos en formato GeoJSON del esquema "ruido"
app.get('/polygons/:layer', async (req, res) => {
  const { layer } = req.params;

  try {
    const client = await pool.connect();
    const query = `
      SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features', jsonb_agg(features.feature)
      ) AS geojson
      FROM (
        SELECT jsonb_build_object(
          'type', 'Feature',
          'id', id,
          'geometry', ST_AsGeoJSON(geom)::jsonb,
          'properties', to_jsonb(inputs) - 'geom'
        ) AS feature
        FROM (SELECT * FROM ruido.${layer}) inputs
      ) features;
    `;

    const result = await client.query(query);
    client.release();

    res.json(result.rows[0].geojson);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint para obtener los polígonos en formato GeoJSON del esquema "mediciones"
app.get('/polygonsM/:layer', async (req, res) => {
  const { layer } = req.params;

  try {
    const client = await pool.connect();
    const query = `
      SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features', jsonb_agg(features.feature)
      ) AS geojson
      FROM (
        SELECT jsonb_build_object(
          'type', 'Feature',
          'id', id,
          'geometry', ST_AsGeoJSON(geom)::jsonb,
          'properties', to_jsonb(inputs) - 'geom'
        ) AS feature
        FROM (SELECT * FROM medicion.${layer}) inputs
      ) features;
    `;

    const result = await client.query(query);
    client.release();

    res.json(result.rows[0].geojson);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint para obtener los polígonos en formato GeoJSON del esquema "fotografias"
app.get('/polygonsF/:layer', async (req, res) => {
  const { layer } = req.params;

  try {
    const client = await pool.connect();
    const query = `
      SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features', jsonb_agg(features.feature)
      ) AS geojson
      FROM (
        SELECT jsonb_build_object(
          'type', 'Feature',
          'id', id,
          'geometry', ST_AsGeoJSON(geom)::jsonb,
          'properties', to_jsonb(inputs) - 'geom'
        ) AS feature
        FROM (SELECT * FROM fotografias.${layer}) inputs
      ) features;
    `;

    const result = await client.query(query);
    client.release();

    res.json(result.rows[0].geojson);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/layersShpBase', async (req, res) => {
  try {
    const client = await pool.connect();
    const query = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'shp_base';
    `;

    const result = await client.query(query);
    client.release();

    const layers = result.rows.map(row => row.table_name);
    res.json(layers);
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/polygonsShpBase/:layer', async (req, res) => {
  const layer = req.params.layer;
  try {
      const result = await pool.query(`SELECT ST_AsGeoJSON(geom) as geometry, * FROM shp_base.${layer}`);
      const features = result.rows.map(row => ({
          type: 'Feature',
          geometry: JSON.parse(row.geometry),
          properties: row,
      }));
      res.json({ type: 'FeatureCollection', features });
  } catch (error) {
      console.error('Error fetching polygons:', error);
      res.status(500).json({ error: 'Error fetching polygons' });
  }
});


app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
