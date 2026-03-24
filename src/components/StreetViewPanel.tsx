import React, { useEffect, useRef } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Called when the Pegman is dropped — parent should open the panel at this position */
  onActivate?: (pos: { lat: number; lng: number }) => void;
  /** Position to navigate to when the panel opens (e.g. from Pegman drop) */
  initialPosition?: { lat: number; lng: number } | null;
  onPositionChange?: (pos: { lat: number; lng: number } | null) => void;
  onHeadingChange?: (heading: number) => void;
}

export const StreetViewPanel = ({
  isOpen,
  onClose,
  onActivate,
  initialPosition,
  onPositionChange,
  onHeadingChange,
}: Props) => {
  const map = useMap();
  const containerRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const mapListenersRef = useRef<google.maps.MapsEventListener[]>([]);

  // Always-fresh refs so event listeners never hold stale closures
  const onActivateRef = useRef(onActivate);
  const onPositionChangeRef = useRef(onPositionChange);
  const onHeadingChangeRef = useRef(onHeadingChange);
  useEffect(() => {
    onActivateRef.current = onActivate;
    onPositionChangeRef.current = onPositionChange;
    onHeadingChangeRef.current = onHeadingChange;
  });

  // Keep a ref to initialPosition so the isOpen effect reads the latest value
  const initialPositionRef = useRef(initialPosition);
  useEffect(() => {
    initialPositionRef.current = initialPosition;
  });

  // Initialise panoramas once the map is ready
  useEffect(() => {
    if (!map || !containerRef.current) return;

    // Panel panorama — renders inside the slide-in div
    if (!panoramaRef.current) {
      panoramaRef.current = new google.maps.StreetViewPanorama(containerRef.current, {
        visible: false,
        addressControl: true,
        fullscreenControl: false,
        motionTrackingControl: false,
      });
    }

    // Dummy panorama: replace the map's built-in Street View so the Pegman never
    // opens Google's own overlay. The div must be in the DOM (but hidden) so that
    // Google Maps fully initialises it and fires position/visibility events.
    const dummyDiv = document.createElement('div');
    Object.assign(dummyDiv.style, {
      position: 'fixed',
      width: '1px',
      height: '1px',
      opacity: '0',
      pointerEvents: 'none',
      top: '-9999px',
      left: '-9999px',
      overflow: 'hidden',
    });
    document.body.appendChild(dummyDiv);

    const dummyPanorama = new google.maps.StreetViewPanorama(dummyDiv, {
      visible: false,
      addressControl: false,
      fullscreenControl: false,
      motionTrackingControl: false,
    });
    map.setStreetView(dummyPanorama);

    // Capture position as soon as it is set (fires before visible_changed)
    let capturedPos: { lat: number; lng: number } | null = null;
    const l1 = dummyPanorama.addListener('position_changed', () => {
      const pos = dummyPanorama.getPosition();
      if (pos) capturedPos = { lat: pos.lat(), lng: pos.lng() };
    });

    // When Pegman activates the dummy panorama: suppress it and open our panel
    const l2 = dummyPanorama.addListener('visible_changed', () => {
      if (dummyPanorama.getVisible()) {
        dummyPanorama.setVisible(false);
        if (capturedPos) {
          onActivateRef.current?.(capturedPos);
          capturedPos = null;
        }
      }
    });

    mapListenersRef.current = [l1, l2];

    return () => {
      mapListenersRef.current.forEach(l => google.maps.event.removeListener(l));
      if (document.body.contains(dummyDiv)) document.body.removeChild(dummyDiv);
    };
  }, [map]);

  // When the panel opens, navigate to initialPosition (Pegman drop) or map center.
  // Attach position/heading listeners so the purple dot stays in sync.
  useEffect(() => {
    if (!map || !panoramaRef.current) return;
    if (!isOpen) return;

    const pano = panoramaRef.current;

    const pinned = initialPositionRef.current;
    const center = map.getCenter();
    const startPos: { lat: number; lng: number } | null =
      pinned ?? (center ? { lat: center.lat(), lng: center.lng() } : null);

    if (startPos) {
      pano.setPosition(startPos);
      pano.setVisible(true);
      onPositionChangeRef.current?.(startPos);
      onHeadingChangeRef.current?.(pano.getPov()?.heading ?? 0);
    }

    const posListener = pano.addListener('position_changed', () => {
      const pos = pano.getPosition();
      if (pos) onPositionChangeRef.current?.({ lat: pos.lat(), lng: pos.lng() });
    });

    const povListener = pano.addListener('pov_changed', () => {
      const pov = pano.getPov();
      if (pov != null) onHeadingChangeRef.current?.(pov.heading ?? 0);
    });

    return () => {
      google.maps.event.removeListener(posListener);
      google.maps.event.removeListener(povListener);
      pano.setVisible(false);
      onPositionChangeRef.current?.(null);
    };
  }, [isOpen, map]);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '50%',
          height: '100%',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          zIndex: 1100,
          boxShadow: '-4px 0 16px rgba(0,0,0,0.25)',
          background: '#1a1a1a',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: '#1a73e8',
            color: '#fff',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          <span>Street View</span>
          <button
            onClick={onClose}
            title="Close"
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '18px',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '2px 6px',
            }}
          >
            ✕
          </button>
        </div>
        <div ref={containerRef} style={{ flex: 1 }} />
      </div>
    </>
  );
};
