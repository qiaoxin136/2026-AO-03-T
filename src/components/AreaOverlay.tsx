import React, { useEffect, useRef } from 'react';
import { useMap, AdvancedMarker } from '@vis.gl/react-google-maps';

interface Props {
  active: boolean;
  points: Array<{ lat: number; lng: number }>;
  area: string | null;
  onFinish: () => void;
  onClear: () => void;
}

export const AreaOverlay = ({ active, points, area, onFinish, onClear }: Props) => {
  const map = useMap();
  const polygonRef = useRef<google.maps.Polygon | null>(null);

  // Crosshair cursor while tool is active
  useEffect(() => {
    if (!map) return;
    map.setOptions({ draggableCursor: active ? 'crosshair' : '' });
    return () => { map.setOptions({ draggableCursor: '' }); };
  }, [map, active]);

  // Draw / update the polygon as points are added
  useEffect(() => {
    if (!map) return;
    polygonRef.current?.setMap(null);
    polygonRef.current = null;

    if (points.length >= 2) {
      const finished = !!area;
      polygonRef.current = new google.maps.Polygon({
        paths: points,
        strokeColor: '#e65100',
        strokeOpacity: 0.9,
        strokeWeight: 2,
        fillColor: '#ff6d00',
        fillOpacity: finished ? 0.22 : 0.08,
        map,
      });
    }
    return () => { polygonRef.current?.setMap(null); };
  }, [map, points, area]);

  return (
    <>
      {/* Vertex markers — first point is larger and orange */}
      {points.map((pt, i) => (
        <AdvancedMarker key={i} position={pt}>
          <div
            style={{
              width: i === 0 ? 16 : 11,
              height: i === 0 ? 16 : 11,
              borderRadius: '50%',
              background: i === 0 ? '#e65100' : '#fff8f0',
              border: `${i === 0 ? 3 : 2}px solid #e65100`,
              boxShadow: '0 1px 5px rgba(0,0,0,0.35)',
            }}
          />
        </AdvancedMarker>
      ))}

      {/* Hint shown while drawing */}
      {active && points.length > 0 && points.length < 3 && !area && (
        <div
          style={{
            position: 'fixed',
            bottom: 36,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.95)',
            padding: '7px 16px',
            borderRadius: 8,
            boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
            zIndex: 1300,
            fontFamily: 'Arial, sans-serif',
            fontSize: 13,
            color: '#555',
            border: '1px solid rgba(230,81,0,0.2)',
            whiteSpace: 'nowrap',
          }}
        >
          Click to add points &nbsp;·&nbsp; need at least {3 - points.length} more
        </div>
      )}

      {/* Finish / Cancel buttons — shown after 3+ points */}
      {active && points.length >= 3 && !area && (
        <div
          style={{
            position: 'fixed',
            bottom: 36,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1300,
            display: 'flex',
            gap: 8,
          }}
        >
          <button
            onClick={onFinish}
            style={{
              background: '#e65100',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 22px',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'Arial, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
            }}
          >
            ✓ Finish
          </button>
          <button
            onClick={onClear}
            style={{
              background: '#fff',
              color: '#666',
              border: '1px solid #ccc',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'Arial, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Area result bar */}
      {area && (
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
            border: '1px solid rgba(230,81,0,0.25)',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: 16 }}>📐</span>
          Area:&nbsp;
          <span style={{ color: '#e65100' }}>{area}</span>
          <button
            onClick={onClear}
            title="Clear"
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
