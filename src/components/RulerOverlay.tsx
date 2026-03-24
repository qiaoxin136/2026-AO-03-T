import React, { useEffect, useRef } from 'react';
import { useMap, AdvancedMarker } from '@vis.gl/react-google-maps';

interface Props {
  active: boolean;
  points: Array<{ lat: number; lng: number }>;
  distance: string | null;
  onClear: () => void;
}

export const RulerOverlay = ({ active, points, distance, onClear }: Props) => {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  // Crosshair cursor while ruler is active
  useEffect(() => {
    if (!map) return;
    map.setOptions({ draggableCursor: active ? 'crosshair' : '' });
    return () => { map.setOptions({ draggableCursor: '' }); };
  }, [map, active]);

  // Draw / update the polyline between the two points
  useEffect(() => {
    if (!map) return;
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    if (points.length === 2) {
      polylineRef.current = new google.maps.Polyline({
        path: points,
        strokeColor: '#2e7d32',
        strokeOpacity: 0.85,
        strokeWeight: 2.5,
        map,
        icons: [
          {
            icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3 },
            offset: '50%',
          },
        ],
      });
    }
    return () => { polylineRef.current?.setMap(null); };
  }, [map, points]);

  return (
    <>
      {/* Blue dot for point A, red dot for point B */}
      {points.map((pt, i) => (
        <AdvancedMarker key={i} position={pt}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: i === 0 ? '#1a73e8' : '#2e7d32',
              border: '2.5px solid white',
              boxShadow: '0 1px 6px rgba(0,0,0,0.45)',
            }}
          />
        </AdvancedMarker>
      ))}

      {/* Distance result bar */}
      {distance && (
        <div
          style={{
            position: 'fixed',
            bottom: 36,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.97)',
            padding: '9px 18px',
            borderRadius: 10,
            boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
            zIndex: 1300,
            fontFamily: 'Arial, sans-serif',
            fontSize: 14,
            fontWeight: 700,
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            border: '1px solid rgba(26,115,232,0.2)',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: 16 }}>📏</span>
          Street distance:&nbsp;
          <span style={{ color: '#1a73e8' }}>{distance}</span>
          <button
            onClick={onClear}
            title="Clear measurement"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#888',
              fontSize: 16,
              lineHeight: 1,
              padding: '0 2px',
              marginLeft: 4,
            }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
};
