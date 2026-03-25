import React, { useEffect, useRef } from 'react';
import { AdvancedMarker, useMap } from '@vis.gl/react-google-maps';

export interface ProfilePoint {
  lat: number;
  lng: number;
  elevation: number; // meters
  distanceFt: number; // feet from point 1
}

interface Props {
  active: boolean;
  points: Array<{ lat: number; lng: number }>;
  profileData: ProfilePoint[] | null;
  loading: boolean;
  samples: number;
  onSamplesChange: (n: number) => void;
  onFinish: () => void;
  onClear: () => void;
}

// ── tiny SVG chart ──────────────────────────────────────────────────────────

const CHART_W = 1434;
const CHART_H = 512;
const ML = 133; // margin left
const MR = 42; // margin right
const MT = 46; // margin top
const MB = 107; // margin bottom
const PW = CHART_W - ML - MR;
const PH = CHART_H - MT - MB;

function ElevationChart({ data, onClose }: { data: ProfilePoint[]; onClose: () => void }) {
  const maxDist = data[data.length - 1].distanceFt;
  const elevsFt = data.map(p => p.elevation * 3.28084);
  const minEl = Math.min(...elevsFt);
  const maxEl = Math.max(...elevsFt);
  const pad = Math.max((maxEl - minEl) * 0.12, 1);
  const elLo = minEl - pad;
  const elHi = maxEl + pad;

  const toX = (distFt: number) => ML + (distFt / maxDist) * PW;
  const toY = (elFt: number) => MT + PH - ((elFt - elLo) / (elHi - elLo)) * PH;

  // polyline path
  const pts = data.map(p => `${toX(p.distanceFt).toFixed(1)},${toY(p.elevation * 3.28084).toFixed(1)}`).join(' ');

  // filled area
  const first = data[0];
  const last = data[data.length - 1];
  const areaPath =
    `M ${toX(first.distanceFt).toFixed(1)},${(MT + PH).toFixed(1)} ` +
    data.map(p => `L ${toX(p.distanceFt).toFixed(1)},${toY(p.elevation * 3.28084).toFixed(1)}`).join(' ') +
    ` L ${toX(last.distanceFt).toFixed(1)},${(MT + PH).toFixed(1)} Z`;

  // Y axis ticks
  const yTicks: number[] = [];
  const rawRange = elHi - elLo;
  const step = rawRange < 5 ? 1 : rawRange < 20 ? 2 : rawRange < 60 ? 10 : rawRange < 200 ? 20 : rawRange < 600 ? 50 : 100;
  const yStart = Math.ceil(elLo / step) * step;
  for (let v = yStart; v <= elHi; v += step) yTicks.push(v);

  // X axis ticks – up to 6
  const xTicks: number[] = [];
  const xStep = maxDist <= 1000 ? 100 : maxDist <= 5000 ? 500 : maxDist <= 10000 ? 1000 : maxDist <= 50000 ? 5000 : 10000;
  for (let v = 0; v <= maxDist; v += xStep) xTicks.push(v);

  // format distance label
  const fmtDist = (ft: number) =>
    ft >= 5280 ? `${(ft / 5280).toFixed(1)} mi` : `${ft.toFixed(0)} ft`;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 36,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(255,255,255,0.97)',
        borderRadius: 12,
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        zIndex: 1300,
        padding: '10px 14px 6px 10px',
        border: '1px solid rgba(26,83,194,0.2)',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, fontWeight: 700, color: '#333' }}>
          Elevation Profile &nbsp;
          <span style={{ color: '#888', fontWeight: 400 }}>
            ({fmtDist(maxDist)}, {(maxEl - minEl).toFixed(1)} ft Δ)
          </span>
        </span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 16, lineHeight: 1, padding: '0 2px' }}
        >✕</button>
      </div>
      <svg width={CHART_W} height={CHART_H}>
        <defs>
          <linearGradient id="profileGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a53c2" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1a53c2" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {/* Y grid lines */}
        {yTicks.map(v => (
          <line key={v} x1={ML} x2={ML + PW} y1={toY(v)} y2={toY(v)}
            stroke="#e0e0e0" strokeWidth={1} />
        ))}

        {/* filled area */}
        <path d={areaPath} fill="url(#profileGrad)" />

        {/* profile line */}
        <polyline points={pts} fill="none" stroke="#1a53c2" strokeWidth={2.2} strokeLinejoin="round" />

        {/* dots at each sample */}
        {data.map((p, i) => (
          <circle key={i} cx={toX(p.distanceFt)} cy={toY(p.elevation * 3.28084)} r={2.5}
            fill="#1a53c2" stroke="white" strokeWidth={1} />
        ))}

        {/* start dot (blue) */}
        <circle cx={toX(0)} cy={toY(data[0].elevation * 3.28084)} r={5}
          fill="#1a73e8" stroke="white" strokeWidth={2} />
        {/* end dot (orange) */}
        <circle cx={toX(maxDist)} cy={toY(last.elevation * 3.28084)} r={5}
          fill="#f57c00" stroke="white" strokeWidth={2} />

        {/* axes */}
        <line x1={ML} y1={MT} x2={ML} y2={MT + PH} stroke="#999" strokeWidth={1} />
        <line x1={ML} y1={MT + PH} x2={ML + PW} y2={MT + PH} stroke="#999" strokeWidth={1} />

        {/* Y axis ticks + labels */}
        {yTicks.map(v => (
          <g key={v}>
            <line x1={ML - 4} x2={ML} y1={toY(v)} y2={toY(v)} stroke="#999" strokeWidth={1} />
            <text x={ML - 6} y={toY(v)} textAnchor="end" dominantBaseline="middle"
              fontSize={9} fill="#555" fontFamily="Arial,sans-serif">
              {v}
            </text>
          </g>
        ))}
        {/* Y axis label */}
        <text
          transform={`translate(10,${MT + PH / 2}) rotate(-90)`}
          textAnchor="middle" fontSize={10} fill="#333" fontFamily="Arial,sans-serif" fontWeight="700"
        >
          Elev (ft)
        </text>

        {/* X axis ticks + labels */}
        {xTicks.map(v => (
          <g key={v}>
            <line x1={toX(v)} x2={toX(v)} y1={MT + PH} y2={MT + PH + 4} stroke="#999" strokeWidth={1} />
            <text x={toX(v)} y={MT + PH + 14} textAnchor="middle"
              fontSize={9} fill="#555" fontFamily="Arial,sans-serif">
              {fmtDist(v)}
            </text>
          </g>
        ))}
        {/* X axis label */}
        <text x={ML + PW / 2} y={CHART_H - 4} textAnchor="middle"
          fontSize={10} fill="#333" fontFamily="Arial,sans-serif" fontWeight="700">
          Distance
        </text>
      </svg>
    </div>
  );
}

// ── marker colours cycling through a palette ─────────────────────────────────
const MARKER_COLORS = ['#1a73e8', '#f57c00', '#2e7d32', '#6a1b9a', '#c62828', '#00796b', '#ad1457', '#0277bd'];

// ── main overlay ────────────────────────────────────────────────────────────

export const ProfileOverlay = ({ active, points, profileData, loading, samples, onSamplesChange, onFinish, onClear }: Props) => {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    const m = map;
    if (!m) return;
    if (polylineRef.current) { polylineRef.current.setMap(null); polylineRef.current = null; }
    if (points.length >= 2) {
      polylineRef.current = new google.maps.Polyline({
        path: points,
        strokeColor: '#555',
        strokeOpacity: 0,
        strokeWeight: 0,
        icons: [{
          icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.7, strokeColor: '#555', scale: 3 },
          offset: '0',
          repeat: '12px',
        }],
        map: m,
      });
    }
    return () => { polylineRef.current?.setMap(null); };
  }, [points]);

  return (
    <>
      {/* Numbered markers for each clicked point */}
      {points.map((pt, i) => (
        <AdvancedMarker key={i} position={pt}>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: MARKER_COLORS[i % MARKER_COLORS.length],
            border: '2.5px solid white',
            boxShadow: '0 1px 6px rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 11, fontWeight: 700, fontFamily: 'Arial,sans-serif',
          }}>{i + 1}</div>
        </AdvancedMarker>
      ))}

      {/* Status bar — only when tool is active and no chart yet */}
      {active && !profileData && (
        <div style={{
          position: 'fixed', bottom: 36, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.97)', padding: '9px 18px', borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.22)', zIndex: 1300,
          fontFamily: 'Arial, sans-serif', fontSize: 14, fontWeight: 700, color: '#333',
          display: 'flex', alignItems: 'center', gap: 12,
          border: '1px solid rgba(26,83,194,0.2)', whiteSpace: 'nowrap',
        }}>
          <span style={{ fontSize: 15 }}>📈</span>
          {loading
            ? <span style={{ color: '#1a53c2' }}>Calculating elevation profile…</span>
            : points.length === 0
              ? <span style={{ color: '#1a53c2' }}>Click to add points on the map (up to 15)</span>
              : <span style={{ color: '#1a53c2' }}>
                  {points.length} point{points.length > 1 ? 's' : ''} added
                  {points.length < 15
                    ? <span style={{ color: '#888', fontWeight: 400 }}> — click to add more or click <b>Done</b></span>
                    : <span style={{ color: '#888', fontWeight: 400 }}> (max reached) — click <b>Done</b></span>
                  }
                </span>
          }
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 400, fontSize: 13, color: '#555' }}>
            Samples:
            <input
              type="number"
              min={10}
              max={150}
              value={samples}
              onChange={e => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 10 && v <= 150) onSamplesChange(v);
              }}
              style={{
                width: 58, padding: '3px 6px', borderRadius: 5,
                border: '1.5px solid #bbb', fontSize: 13, fontWeight: 700,
                textAlign: 'center', outline: 'none',
              }}
            />
          </label>
          {points.length >= 2 && !loading && (
            <button
              onClick={onFinish}
              style={{
                background: '#1a73e8', color: 'white', border: 'none',
                borderRadius: 6, padding: '5px 14px', cursor: 'pointer',
                fontSize: 13, fontWeight: 700,
              }}
            >Done</button>
          )}
          <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 16, lineHeight: 1, padding: '0 2px', marginLeft: 4 }}>✕</button>
        </div>
      )}

      {/* Chart */}
      {profileData && <ElevationChart data={profileData} onClose={onClear} />}
    </>
  );
};
