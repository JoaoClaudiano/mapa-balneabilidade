import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as turf from '@turf/turf';
import pontosData from '../data/pontos.json';
import shorelineData from '../data/shoreline.json';

const Map = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Inicializar mapa
    const map = L.map(mapRef.current).setView([-3.7, -38.5], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Converter pontos para FeatureCollection
    const points = turf.featureCollection(pontosData.features);
    const bbox = [-39.0, -4.5, -38.0, -3.0]; // Ajustar conforme litoral do Ceará

    // Gerar Voronoi
    const voronoi = turf.voronoi(points, { bbox });
    // Atribuir propriedades dos pontos aos polígonos (ordem mantida)
    voronoi.features.forEach((polygon, idx) => {
      if (points.features[idx]) {
        polygon.properties = points.features[idx].properties;
      } else {
        polygon.properties = { status: 'Desconhecido' };
      }
    });

    // Adicionar polígonos de Voronoi
    L.geoJSON(voronoi, {
      style: (feature) => ({
        fillColor: feature.properties.status === 'Próprio' ? 'green' : 'red',
        weight: 1,
        opacity: 0.7,
        fillOpacity: 0.3,
        color: 'gray'
      }),
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`Status: ${feature.properties.status}<br>${feature.properties.nome || ''}`);
      }
    }).addTo(map);

    // Processar linha da costa colorida
    const shorelineLine = shorelineData.features[0];
    const segmented = turf.lineSegment(shorelineLine);
    const coloredSegments = [];

    segmented.features.forEach(segment => {
      let minDist = Infinity;
      let nearestStatus = 'Desconhecido';
      let nearestNome = '';
      points.features.forEach(point => {
        const dist = turf.distance(segment, point, { units: 'meters' });
        if (dist < minDist) {
          minDist = dist;
          nearestStatus = point.properties.status;
          nearestNome = point.properties.nome;
        }
      });
      coloredSegments.push({
        ...segment,
        properties: {
          status: nearestStatus,
          color: nearestStatus === 'Próprio' ? 'green' : 'red',
          nome: nearestNome
        }
      });
    });

    const coloredShoreline = turf.featureCollection(coloredSegments);

    L.geoJSON(coloredShoreline, {
      style: (feature) => ({
        color: feature.properties.color,
        weight: 4,
        opacity: 1
      }),
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`Trecho da costa<br>Baseado em: ${feature.properties.nome}<br>Status: ${feature.properties.status}`);
      }
    }).addTo(map);

    // Opcional: adicionar pontos originais como marcadores
    L.geoJSON(points, {
      pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
        radius: 6,
        fillColor: 'blue',
        color: 'white',
        weight: 1,
        fillOpacity: 0.8
      }),
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`<b>${feature.properties.nome}</b><br>Status: ${feature.properties.status}`);
      }
    }).addTo(map);

    return () => {
      map.remove();
    };
  }, []);

  return <div ref={mapRef} style={{ height: '100vh', width: '100%' }} />;
};

export default Map;
