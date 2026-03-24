import React, {useRef, useEffect, useState} from 'react';
import {useMapsLibrary} from '@vis.gl/react-google-maps';
import Input from '@mui/material/Input';

interface Props {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
}

// This is an example of the classic "Place Autocomplete" widget.
// https://developers.google.com/maps/documentation/javascript/place-autocomplete
export const PlaceAutocompleteClassic = ({onPlaceSelect}: Props) => {
  const [placeAutocomplete, setPlaceAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const options = {
      fields: ['geometry', 'name', 'formatted_address']
    };

    setPlaceAutocomplete(new places.Autocomplete(inputRef.current, options));
  }, [places]);

  useEffect(() => {
    if (!placeAutocomplete) return;

    placeAutocomplete.addListener('place_changed', () => {
      onPlaceSelect(placeAutocomplete.getPlace());
    });
  }, [onPlaceSelect, placeAutocomplete]);

  const handleClear = () => {
    if (inputRef.current) inputRef.current.value = '';
    onPlaceSelect(null);
  };

  return (
    <div className="autocomplete-container" style={{ position: 'relative', display: 'inline-block' }}>
      <input ref={inputRef}
        style={{ fontSize: '1.2rem', color: 'grey', width: '300px', paddingRight: '28px' }}
      />
      <button
        onClick={handleClear}
        title="Clear"
        style={{
          position: 'absolute',
          right: '4px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1rem',
          color: '#888',
          lineHeight: 1,
          padding: '2px 4px',
        }}
      >
        ✕
      </button>
    </div>
  );
};
