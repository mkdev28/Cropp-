'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';

type Marker = {
  id: string;
  lat: number;
  lng: number;
  risk: 'low' | 'medium' | 'high';
  farmer: string;
};

const getColor = (risk: Marker['risk']) => {
  if (risk === 'low') return 'green';
  if (risk === 'medium') return 'orange';
  return 'red';
};

export default function LiveRiskMap({ markers }: { markers: Marker[] }) {
  return (
    <MapContainer
      center={[19.0, 75.0]} // Maharashtra center
      zoom={6}
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
        attribution="© OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {markers.map(m => (
        <CircleMarker
          key={m.id}
          center={[m.lat, m.lng]}
          radius={8}
          pathOptions={{ color: getColor(m.risk) }}
        >
          <Popup>
            <b>{m.farmer}</b><br />
            Risk: {m.risk}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
