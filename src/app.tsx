import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  APIProvider,
  Map,
  ControlPosition,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";

import { CustomMapControl } from "./map-control";
import MapHandler from "./map-handler";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormGroup from "@mui/material/FormGroup";
import { Checkbox } from "@mui/material";


import { GeoJsonLayer } from "@deck.gl/layers/typed";
import { MVTLayer } from "@deck.gl/geo-layers/typed";
import { DeckGlOverlay } from "./deckgl-overlay";

import { Development } from "./components/development";
import { StreetViewPanel } from "./components/StreetViewPanel";
import { RulerOverlay } from "./components/RulerOverlay";
import { AreaOverlay } from "./components/AreaOverlay";
import { ProfileOverlay, ProfilePoint } from "./components/ProfileOverlay";

import { Browarduser } from "./components/browarduser";
import { HollywoodLS } from "./components/LS-Hollywood";
import { OtherLS } from "./components/LS-Other";
import { PrivateLS } from "./components/LS-Private";


import type { LayersList } from "@deck.gl/core/typed";

export type AutocompleteMode = { id: string; label: string };

const autocompleteModes: Array<AutocompleteMode> = [
  { id: "classic", label: "Google Autocomplete Widget" },
];

export type DataPoint = [number, number, number];

export type DeckglOverlayProps = { layers?: LayersList };

const DATA_URL =
  "https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/bart.geo.json";

import type { Feature, GeoJSON } from "geojson";

const API_KEY = ""//google api key here


const InfoCursor = ({ active }: { active: boolean }) => {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.setOptions({ draggableCursor: active ? 'crosshair' : '' });
    return () => { map.setOptions({ draggableCursor: '' }); };
  }, [map, active]);
  return null;
};

const App = () => {
  const [data, setData] = useState<GeoJSON | null>(null);
  const [selectedAutocompleteMode, setSelectedAutocompleteMode] =
    useState<AutocompleteMode>({
      id: "classic",
      label: "Google Autocomplete Widget",
    });

  const [selectedPlace, setSelectedPlace] =
    useState<google.maps.places.PlaceResult | null>(null);
  const [activePosition, setActivePosition] = useState<{ lat: number; lng: number } | null>(null);

  const [clickInfo, setClickInfo] = useState<any>(null);

  const [age, setAge] = useState("default");

  const [show1, setShow1] = useState(true);
  const [show2, setShow2] = useState(false);
  const [show3, setShow3] = useState(false);
  const [show4, setShow4] = useState(false);
  const [show5, setShow5] = useState(true);
  const [round, setRound] = useState(false);
  const [develop, setDevelop] = useState(false);
  const [round1, setRound1]=useState(false)

  const [open1, setOpen1] = useState(false);
  const [streetViewOpen, setStreetViewOpen] = useState(false);
  const [streetViewPos, setStreetViewPos] = useState<{ lat: number; lng: number } | null>(null);
  const [streetViewHeading, setStreetViewHeading] = useState(0);
  const [pegmanPos, setPegmanPos] = useState<{ lat: number; lng: number } | null>(null);

  const [rulerActive, setRulerActive] = useState(false);
  const [rulerPoints, setRulerPoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [rulerDistance, setRulerDistance] = useState<string | null>(null);

  const computeStreetDistance = (
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ) => {
    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin: from,
        destination: to,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.IMPERIAL,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          const d = result.routes[0].legs[0].distance?.text ?? 'N/A';
          setRulerDistance(d);
        } else {
          // Fallback: straight-line (Haversine), reported in ft / mi
          const R = 6371000;
          const φ1 = (from.lat * Math.PI) / 180;
          const φ2 = (to.lat * Math.PI) / 180;
          const dφ = ((to.lat - from.lat) * Math.PI) / 180;
          const dλ = ((to.lng - from.lng) * Math.PI) / 180;
          const a =
            Math.sin(dφ / 2) ** 2 +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
          const meters = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const feet = meters * 3.28084;
          setRulerDistance(
            feet >= 5280
              ? `${(feet / 5280).toFixed(2)} mi (straight-line)`
              : `${Math.round(feet)} ft (straight-line)`
          );
        }
      }
    );
  };

  const handleRulerClear = () => {
    setRulerPoints([]);
    setRulerDistance(null);
    setRulerActive(false);
  };

  const [areaActive, setAreaActive] = useState(false);
  const [areaPoints, setAreaPoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [areaResult, setAreaResult] = useState<string | null>(null);

  const computeAreaStr = (pts: Array<{ lat: number; lng: number }>): string => {
    const n = pts.length;
    if (n < 3) return '';
    const R = 6371000;
    const lat0 = (pts[0].lat * Math.PI) / 180;
    const coords = pts.map(p => ({
      x: ((p.lng - pts[0].lng) * Math.PI / 180) * R * Math.cos(lat0),
      y: ((p.lat - pts[0].lat) * Math.PI / 180) * R,
    }));
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      sum += coords[i].x * coords[j].y;
      sum -= coords[j].x * coords[i].y;
    }
    const sqFt = (Math.abs(sum) / 2) * 10.7639;
    return sqFt < 43560
      ? `${Math.round(sqFt).toLocaleString()} sq ft`
      : `${(sqFt / 43560).toFixed(2)} acres`;
  };

  const handleAreaFinish = () => {
    setAreaResult(computeAreaStr(areaPoints));
    setAreaActive(false);
  };

  const handleAreaClear = () => {
    setAreaPoints([]);
    setAreaResult(null);
    setAreaActive(false);
  };

  const [infoActive, setInfoActive] = useState(false);
  const [infoPoint, setInfoPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);

  const [elevationActive, setElevationActive] = useState(false);
  const [elevationResult, setElevationResult] = useState<{ lat: number; lng: number; meters: number } | null>(null);

  const fetchElevation = (lat: number, lng: number) => {
    const elevator = new google.maps.ElevationService();
    elevator.getElevationForLocations(
      { locations: [{ lat, lng }] },
      (results, status) => {
        if (status === "OK" && results && results.length > 0) {
          setElevationResult({ lat, lng, meters: results[0].elevation });
        }
      }
    );
  };

  const [profileActive, setProfileActive] = useState(false);
  const [profilePoints, setProfilePoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [profileData, setProfileData] = useState<ProfilePoint[] | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSamples, setProfileSamples] = useState(25);

  const fetchProfile = (p1: { lat: number; lng: number }, p2: { lat: number; lng: number }, samples = profileSamples) => {
    setProfileLoading(true);
    const elevator = new google.maps.ElevationService();
    elevator.getElevationAlongPath(
      { path: [p1, p2], samples },
      (results, status) => {
        setProfileLoading(false);
        if (status !== "OK" || !results) return;
        // compute cumulative distance in feet using haversine
        const R = 20925721.8; // Earth radius in feet
        const toRad = (d: number) => d * Math.PI / 180;
        let cumFt = 0;
        const pts: ProfilePoint[] = results.map((r, i) => {
          if (i > 0) {
            const prev = results[i - 1].location!;
            const cur = r.location!;
            const dLat = toRad(cur.lat() - prev.lat());
            const dLng = toRad(cur.lng() - prev.lng());
            const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(prev.lat())) * Math.cos(toRad(cur.lat())) * Math.sin(dLng / 2) ** 2;
            cumFt += 2 * R * Math.asin(Math.sqrt(a));
          }
          return {
            lat: r.location!.lat(),
            lng: r.location!.lng(),
            elevation: r.elevation,
            distanceFt: cumFt,
          };
        });
        setProfileData(pts);
      }
    );
  };

  const handleProfileClear = () => {
    setProfileActive(false);
    setProfilePoints([]);
    setProfileData(null);
    setProfileLoading(false);
  };

  const handleInfoWindowClose = () => {
    setActivePosition(null);
    setClickInfo(null);
  };

  const handleRoundChange = () => {
    setRound(!round);
  };
  const handleDevelop = () => {
    setDevelop(!develop);
  };

  const handleRound1 = () => {
    setRound1(!round1);
  };

  useEffect(() => {
    fetch(DATA_URL)
      .then((res) => res.json())
      .then((data) => setData(data as GeoJSON));
  }, []);

  const layers = [
    new MVTLayer({
    id: "rac",
    data: `https://a.tiles.mapbox.com/v4/hazensawyer.6x1v0m3u/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoiaGF6ZW5zYXd5ZXIiLCJhIjoiY2xmNGQ3MDgyMTE3YjQzcnE1djRpOGVtNiJ9.U06GItbSVWFTsvfg9WwQWQ`,
    pickable: true,
    stroked: true,
    filled: true,
    // extruded: true,
    // pointType: "circle",
    lineWidthScale: 1,
    lineWidthMinPixels: 2,
    getFillColor: (f: any) =>
      f.properties.LANDUSE === "RESIDENTIAL"
        ? [248, 131, 121, 255]
        : f.properties.LANDUSE === "COMMERCIAL"
        ? [255, 68, 51, 255]
        : [204, 204, 255, 255],
    getLineColor: [178, 190, 181, 255],
    getPointRadius: 100,
    getLineWidth: 1,
    // getElevation: 30,
    //pickable: true,
    visible: round1,
  }),
    new MVTLayer({
      id: "lateral",
      data: `https://a.tiles.mapbox.com/v4/hazensawyer.0t8hy4di/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoiaGF6ZW5zYXd5ZXIiLCJhIjoiY2xmNGQ3MDgyMTE3YjQzcnE1djRpOGVtNiJ9.U06GItbSVWFTsvfg9WwQWQ`,

      minZoom: 0,
      maxZoom: 23,
      getLineColor: (f: any) => [169, 169, 169, 255],

      getFillColor: [140, 170, 180],
      getLineWidth: (f: any) => 1,

      lineWidthMinPixels: 1,
      pickable: true,
      visible: show5,
      // onClick: (event) => {
      //   setActivePosition({
      //     lat: event.coordinate![1],
      //     lng: event.coordinate![0],
      //   });
      //   setClickInfo(event);
      // },
    }),
    new MVTLayer({
      id: "gravity-public-pipe",
      data: `https://a.tiles.mapbox.com/v4/hazensawyer.04mlahe9/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoiaGF6ZW5zYXd5ZXIiLCJhIjoiY2xmNGQ3MDgyMTE3YjQzcnE1djRpOGVtNiJ9.U06GItbSVWFTsvfg9WwQWQ`,

      minZoom: 0,
      maxZoom: 23,
      getLineColor: (f: any) =>
        age === "default"
          ? f.properties.DIAMETER < 11
            ? [0, 163, 108, 255]
            : f.properties.DIAMETER < 17
            ? [218, 112, 214, 255]
            : f.properties.DIAMETER < 25
            ? [93, 63, 211, 255]
            : f.properties.DIAMETER < 31
            ? [191, 64, 191, 255]
            : [238, 75, 43, 255]
          : age === "mdd"
          ? [0, 163, 108, 255]
          : age === "add"
          ? [0, 163, 108, 255]
          : age === "material"
          ? f.properties.MATERIAL === "AC"
            ? [0, 163, 108, 255]
            : f.properties.MATERIAL === "CIP"
            ? [218, 112, 214, 255]
            : f.properties.MATERIAL === "VCP"
            ? [71, 135, 120, 255]
            : f.properties.MATERIAL === "DIP"
            ? [69, 75, 27, 255]
            : f.properties.MATERIAL === "PVC"
            ? [191, 64, 191, 255]
            : [238, 75, 43, 255]
          : age === "zone"
          ? f.properties.ZONE === "462"
            ? [0, 163, 108, 255]
            : f.properties.ZONE === "495"
            ? [218, 112, 214, 255]
            : f.properties.ZONE === "523"
            ? [93, 63, 211, 255]
            : f.properties.ZONE === "560"
            ? [191, 64, 191, 255]
            : f.properties.ZONE === "595"
            ? [255, 87, 51, 255]
            : f.properties.ZONE === "605"
            ? [72, 50, 72, 255]
            : f.properties.ZONE === "655"
            ? [169, 92, 104, 255]
            : [238, 75, 43, 255]
          : [0, 163, 108, 255],

      getFillColor: [140, 170, 180],
      getLineWidth: (f: any) =>
        f.properties.DIAMETER < 7
          ? 1
          : f.properties.DIAMETER < 11
          ? 3
          : f.properties.DIAMETER < 17
          ? 5
          : f.properties.DIAMETER < 25
          ? 7
          : f.properties.DIAMETER < 31
          ? 9
          : 11,

      lineWidthMinPixels: 1,
      pickable: true,
      visible: show5,
      onClick: (event) => {
        setActivePosition({
          lat: event.coordinate![1],
          lng: event.coordinate![0],
        });
        setClickInfo(event);
      },
    }),
    new MVTLayer({
      id: "gravity-private-pipe",
      data: `https://a.tiles.mapbox.com/v4/hazensawyer.dhp8w8ur/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoiaGF6ZW5zYXd5ZXIiLCJhIjoiY2xmNGQ3MDgyMTE3YjQzcnE1djRpOGVtNiJ9.U06GItbSVWFTsvfg9WwQWQ`,

      minZoom: 0,
      maxZoom: 23,
      getLineColor: (f: any) =>
        age === "default"
          ? f.properties.DIAMETER < 11
            ? [0, 163, 108, 255]
            : f.properties.DIAMETER < 17
            ? [218, 112, 214, 255]
            : f.properties.DIAMETER < 25
            ? [93, 63, 211, 255]
            : f.properties.DIAMETER < 31
            ? [191, 64, 191, 255]
            : [238, 75, 43, 255]
          : age === "mdd"
          ? [0, 163, 108, 255]
          : age === "add"
          ? [0, 163, 108, 255]
          : age === "material"
          ? f.properties.MATERIAL === "AC"
            ? [0, 163, 108, 255]
            : f.properties.MATERIAL === "CIP"
            ? [218, 112, 214, 255]
            : f.properties.MATERIAL === "VCP"
            ? [71, 135, 120, 255]
            : f.properties.MATERIAL === "DIP"
            ? [69, 75, 27, 255]
            : f.properties.MATERIAL === "PVC"
            ? [191, 64, 191, 255]
            : [238, 75, 43, 255]
          : age === "zone"
          ? f.properties.ZONE === "462"
            ? [0, 163, 108, 255]
            : f.properties.ZONE === "495"
            ? [218, 112, 214, 255]
            : f.properties.ZONE === "523"
            ? [93, 63, 211, 255]
            : f.properties.ZONE === "560"
            ? [191, 64, 191, 255]
            : f.properties.ZONE === "595"
            ? [255, 87, 51, 255]
            : f.properties.ZONE === "605"
            ? [72, 50, 72, 255]
            : f.properties.ZONE === "655"
            ? [169, 92, 104, 255]
            : [238, 75, 43, 255]
          : [0, 163, 108, 255],

      getFillColor: [140, 170, 180],
      getLineWidth: (f: any) =>
        f.properties.DIAMETER < 7
          ? 1
          : f.properties.DIAMETER < 11
          ? 3
          : f.properties.DIAMETER < 17
          ? 5
          : f.properties.DIAMETER < 25
          ? 7
          : f.properties.DIAMETER < 31
          ? 9
          : 11,

      lineWidthMinPixels: 1,
      pickable: true,
      visible: show5,
      onClick: (event) => {
        setActivePosition({
          lat: event.coordinate![1],
          lng: event.coordinate![0],
        });
        setClickInfo(event);
      },
    }),
    new MVTLayer({
      id: "fmpipe",
      data: `https://a.tiles.mapbox.com/v4/hazensawyer.4hfx5po8/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoiaGF6ZW5zYXd5ZXIiLCJhIjoiY2xmNGQ3MDgyMTE3YjQzcnE1djRpOGVtNiJ9.U06GItbSVWFTsvfg9WwQWQ`,

      minZoom: 0,
      maxZoom: 23,
      getLineColor: (f: any) =>
        f.properties.DIAMETER < 10
          ? [128, 0, 32, 255]
          : f.properties.DIAMETER < 20
          ? [233, 116, 81, 255]
          : [255, 195, 0, 255],
      getFillColor: [140, 170, 180],
      getLineWidth: (f: any) =>
        f.properties.DIAMETER < 7
          ? 1
          : f.properties.DIAMETER < 11
          ? 3
          : f.properties.DIAMETER < 17
          ? 4
          : f.properties.DIAMETER < 25
          ? 5
          : f.properties.DIAMETER < 31
          ? 6
          : 7,

      lineWidthMinPixels: 1,
      pickable: true,
      visible: show5,
      onClick: (event) => {
        setActivePosition({
          lat: event.coordinate![1],
          lng: event.coordinate![0],
        });
        setClickInfo(event);
      },
    }),
    new MVTLayer({
      id: "mh",
      data: `https://a.tiles.mapbox.com/v4/hazensawyer.56zc2nx5/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoiaGF6ZW5zYXd5ZXIiLCJhIjoiY2xmNGQ3MDgyMTE3YjQzcnE1djRpOGVtNiJ9.U06GItbSVWFTsvfg9WwQWQ`,
      minZoom: 15,
      maxZoom: 23,
      filled: true,
      getIconAngle: 0,
      getIconColor: [0, 0, 0, 255],
      getIconPixelOffset: [-2, 2],
      getIconSize: 3,
      // getText: (f: any) => f.properties.FACILITYID,
      getPointRadius: (f: any) => 2,
      getTextAlignmentBaseline: "center",
      getTextAnchor: "middle",
      getTextAngle: 0,
      getTextBackgroundColor: [0, 0, 0, 255],
      getTextBorderColor: [0, 0, 0, 255],
      getTextBorderWidth: 0,
      getTextColor: [0, 0, 0, 255],
      getTextPixelOffset: [-12, -12],
      getTextSize: 20,
      pointRadiusMinPixels: 2,

      // getPointRadius: (f: any) => (f.properties.PRESSURE < 45 ? 6 : 3),
      getFillColor: (f: any) => [255, 195, 0, 255],
      // Interactive props
      pickable: true,
      visible: show5,
      autoHighlight: true,
      // ...choice,
      // pointRadiusUnits: "pixels",
      pointType: "circle+text",
      onClick: (event) => {
        setActivePosition({
          lat: event.coordinate![1],
          lng: event.coordinate![0],
        });
        setClickInfo(event);
      },
    }),
    new MVTLayer({
      id: "piperesult",
      data: `https://a.tiles.mapbox.com/v4/hazensawyer.256dihdu/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoiaGF6ZW5zYXd5ZXIiLCJhIjoiY2xmNGQ3MDgyMTE3YjQzcnE1djRpOGVtNiJ9.U06GItbSVWFTsvfg9WwQWQ`,

      minZoom: 0,
      maxZoom: 23,
      getLineColor: (f: any) =>
        f.properties.Surcharge < 0.5
          ? [255, 195, 0, 255]
          : f.properties.Surcharge < 1
          ? [248, 131, 121, 255]
          : f.properties.Surcharge === 1
          ? [250, 160, 160, 255]
          : f.properties.Surcharge === 2
          ? [233, 116, 81, 255]
          : [233, 116, 81, 255],
      getFillColor: [140, 170, 180],
      getLineWidth: (f: any) =>
        f.properties.Surcharge < 0.25
          ? 1
          : f.properties.Surcharge < 0.5
          ? 1
          : f.properties.Surcharge < 0.75
          ? 2
          : f.properties.Surcharge === 1
          ? 5
          : f.properties.Surcharge === 2
          ? 7
          : 1,

      lineWidthMinPixels: 1,
      pickable: true,
      visible: show2,
      onClick: (event) => {
        setActivePosition({
          lat: event.coordinate![1],
          lng: event.coordinate![0],
        });
        setClickInfo(event);
      },
    }),
    new MVTLayer({
      id: "mhresult",
      data: `https://a.tiles.mapbox.com/v4/hazensawyer.1esbmcmq/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoiaGF6ZW5zYXd5ZXIiLCJhIjoiY2xmNGQ3MDgyMTE3YjQzcnE1djRpOGVtNiJ9.U06GItbSVWFTsvfg9WwQWQ`,
      minZoom: 1,
      maxZoom: 23,
      filled: true,
      getIconAngle: 0,
      getIconColor: [0, 0, 0, 255],
      getIconPixelOffset: [-2, 2],
      getIconSize: 3,
      // getText: (f: any) => f.properties.FACILITYID,
      getPointRadius: (f: any) =>
        f.properties.FloodDepth > 0
          ? 1
          : f.properties.FloodDepth === 0
          ? 15
          : f.properties.FloodDepth > -2
          ? 5
          : f.properties.FloodDepth > -4
          ? 3
          : f.properties.FloodDepth > -6
          ? 2
          : 1,
      getTextAlignmentBaseline: "center",
      getTextAnchor: "middle",
      getTextAngle: 0,
      getTextBackgroundColor: [0, 0, 0, 255],
      getTextBorderColor: [0, 0, 0, 255],
      getTextBorderWidth: 0,
      getTextColor: [0, 0, 0, 255],
      getTextPixelOffset: [-12, -12],
      getTextSize: 20,
      pointRadiusMinPixels: 2,

      // getPointRadius: (f: any) => (f.properties.PRESSURE < 45 ? 6 : 3),
      getFillColor: (f: any) =>
        f.properties.FloodDepth > 0
          ? [255, 253, 208, 255]
          : f.properties.FloodDepth === 0
          ? [233, 116, 81, 255]
          : f.properties.FloodDepth > -2
          ? [250, 160, 160, 255]
          : f.properties.FloodDepth > -5
          ? [253, 218, 13, 255]
          : [255, 253, 208, 255],
      pickable: true,
      visible: show2,
      autoHighlight: true,
      // ...choice,
      // pointRadiusUnits: "pixels",
      pointType: "circle+text",
      onClick: (event) => {
        setActivePosition({
          lat: event.coordinate![1],
          lng: event.coordinate![0],
        });
        setClickInfo(event);
      },
    }),
    new MVTLayer({
      id: "water-only",
      data: `https://a.tiles.mapbox.com/v4/hazensawyer.6tty7fyl/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoiaGF6ZW5zYXd5ZXIiLCJhIjoiY2xmNGQ3MDgyMTE3YjQzcnE1djRpOGVtNiJ9.U06GItbSVWFTsvfg9WwQWQ`,
      minZoom: 1,
      maxZoom: 23,
      filled: true,
      getElevation: 100, 
      getIconAngle: 0,
      getIconColor: [0, 0, 0, 255],
      getIconPixelOffset: [-2, 2],
      getIconSize: 5,
      // getText: (f: any) => f.properties.FACILITYID,
      getPointRadius: (f: any) => 3,
      getTextAlignmentBaseline: "center",
      getTextAnchor: "middle",
      getTextAngle: 0,
      getTextBackgroundColor: [0, 0, 0, 255],
      getTextBorderColor: [0, 0, 0, 255],
      getTextBorderWidth: 0,
      getTextColor: [0, 0, 0, 255],
      getTextPixelOffset: [-12, -12],
      getTextSize: 20,
      pointRadiusMinPixels: 2,

      // getPointRadius: (f: any) => (f.properties.PRESSURE < 45 ? 6 : 3),
      getFillColor: (f: any) => [250, 95, 85, 255],
      // Interactive props
      pickable: true,
      visible: round,
      autoHighlight: true,
      // ...choice,
      // pointRadiusUnits: "pixels",
      pointType: "circle+text",
      onClick: (event) => {
        setActivePosition({
          lat: event.coordinate![1],
          lng: event.coordinate![0],
        });
        setClickInfo(event);
      },
    }),
    new MVTLayer({
      id: "sewer-only",
      data: `https://a.tiles.mapbox.com/v4/hazensawyer.af2s6vri/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoiaGF6ZW5zYXd5ZXIiLCJhIjoiY2xmNGQ3MDgyMTE3YjQzcnE1djRpOGVtNiJ9.U06GItbSVWFTsvfg9WwQWQ`,
      minZoom: 1,
      maxZoom: 23,
      filled: true,
      getElevation: 100, 
      getIconAngle: 0,
      getIconColor: [0, 0, 0, 255],
      getIconPixelOffset: [-2, 2],
      getIconSize: 5,
      // getText: (f: any) => f.properties.FACILITYID,
      getPointRadius: (f: any) => 3,
      getTextAlignmentBaseline: "center",
      getTextAnchor: "middle",
      getTextAngle: 0,
      getTextBackgroundColor: [0, 0, 0, 255],
      getTextBorderColor: [0, 0, 0, 255],
      getTextBorderWidth: 0,
      getTextColor: [0, 0, 0, 255],
      getTextPixelOffset: [-12, -12],
      getTextSize: 20,
      pointRadiusMinPixels: 2,

      // getPointRadius: (f: any) => (f.properties.PRESSURE < 45 ? 6 : 3),
      getFillColor: (f: any) => [144, 238, 144, 255],
      // Interactive props
      pickable: true,
      visible: round,
      autoHighlight: true,
      // ...choice,
      // pointRadiusUnits: "pixels",
      pointType: "circle+text",
      onClick: (event) => {
        setActivePosition({
          lat: event.coordinate![1],
          lng: event.coordinate![0],
        });
        setClickInfo(event);
      },
    }),
    new GeoJsonLayer({
      id: "broward",
      data: Browarduser,
      minZoom: 1,
      maxZoom: 23,
      filled: true,
      getElevation: 20, 
      getIconAngle: 0,
      getIconColor: [0, 0, 0, 255],
      getIconPixelOffset: [-2, 2],
      getIconSize: 5,
      // getText: (f: any) => f.properties.FACILITYID,
      getPointRadius: (f: any) => 3,
      getTextAlignmentBaseline: "center",
      getTextAnchor: "middle",
      getTextAngle: 0,
      getTextBackgroundColor: [0, 0, 0, 255],
      getTextBorderColor: [0, 0, 0, 255],
      getTextBorderWidth: 0,
      getTextColor: [0, 0, 0, 255],
      getTextPixelOffset: [-12, -12],
      getTextSize: 20,
      pointRadiusMinPixels: 2,

      // getPointRadius: (f: any) => (f.properties.PRESSURE < 45 ? 6 : 3),
      getFillColor: (f: any) => [63, 0, 255, 255],
      // Interactive props
      pickable: true,
      visible: round,
      autoHighlight: true,
      // ...choice,
      // pointRadiusUnits: "pixels",
      pointType: "circle+text",
      onClick: (event) => {
        setActivePosition({
          lat: event.coordinate![1],
          lng: event.coordinate![0],
        });
        setClickInfo(event);
      },
    }),
    new GeoJsonLayer({
      id: "development",
      data: Development,
      extruded: true,
      filled: true,
      getElevation: 30,
      getFillColor: [63, 255, 0, 255],
      // getIconAngle: 0,
      // getIconColor: [0, 0, 0, 255],
      // getIconPixelOffset: [0, 0],
      // getIconSize: 1,
      getLineColor: [0, 0, 0, 255],
      getLineWidth: 1,
      getPointRadius: 8,
      getText: (f: any) => f.properties.Id,
      getTextAlignmentBaseline: "center",
      getTextAnchor: "middle",
      // getTextAngle: 0,
      // getTextBackgroundColor: [255, 255, 255, 255],
      // getTextBorderColor: [0, 0, 0, 255],
      // getTextBorderWidth: 0,
      // getTextColor: [0, 0, 0, 255],
      // getTextPixelOffset: [0, 0],
      getTextSize: 8,
      // iconAlphaCutoff: 0.05,
      // iconAtlas: null,
      // iconBillboard: true,
      // iconMapping: {},
      // iconSizeMaxPixels: Number.MAX_SAFE_INTEGER,
      // iconSizeMinPixels: 0,
      // iconSizeScale: 1,
      // iconSizeUnits: 'pixels',
      // lineBillboard: false,
      // lineCapRounded: false,
      // lineJointRounded: false,
      // lineMiterLimit: 4,
      // lineWidthMaxPixels: Number.MAX_SAFE_INTEGER,
      lineWidthMinPixels: 1,
      lineWidthScale: 1,
      lineWidthUnits: "meters",
      // material: true,
      // pointAntialiasing: true,
      // pointBillboard: false,
      // pointRadiusMaxPixels: Number.MAX_SAFE_INTEGER,
      pointRadiusMinPixels: 2,
      pointRadiusScale: 1,
      pointRadiusUnits: "pixels",
      pointType: "circle+text",
      stroked: true,

      // textBackground: false,
      // textBackgroundPadding: [0, 0, 0, 0],
      // textBillboard: true,
      // textCharacterSet: [' ', '!', '"', '#', '$', '%', '&', ''', '(', ')', '*', '+', ',', '-', '.', '/', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?', '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[', '\', ']', '^', '_', '`', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '{', '|', '}', '~', ''],
      // textFontFamily: 'Monaco, monospace',
      // textFontSettings: {},
      // textFontWeight: 'normal',
      // textLineHeight: 1,
      // textMaxWidth: -1,
      // textOutlineColor: [0, 0, 0, 255],
      // textOutlineWidth: 0,
      // textSizeMaxPixels: Number.MAX_SAFE_INTEGER,
      // textSizeMinPixels: 0,
      // textSizeScale: 1,
      // textSizeUnits: 'pixels',
      // textWordBreak: 'break-word',
      // wireframe: false,

      /* props inherited from Layer class */

      autoHighlight: true,
      // coordinateOrigin: [0, 0, 0],
      // coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
      // highlightColor: [0, 0, 128, 128],
      // modelMatrix: null,
      // opacity: 1,
      pickable: true,
      visible: develop,
      onClick: (event) => {
        setActivePosition({
          lat: event.coordinate![1],
          lng: event.coordinate![0],
        });
        setClickInfo(event);
      },
    }),
    new GeoJsonLayer({
      id: "hollywoodls",
      data: HollywoodLS,
      extruded: true,
      filled: true,
      getElevation: 30,
      getFillColor: [63, 0, 255, 255],
      // getIconAngle: 0,
      // getIconColor: [0, 0, 0, 255],
      // getIconPixelOffset: [0, 0],
      // getIconSize: 1,
      getLineColor: [0, 0, 0, 255],
      getLineWidth: 1,
      getPointRadius: 5,
      getText: (f: any) => f.properties.Id,
      getTextAlignmentBaseline: "center",
      getTextAnchor: "middle",
      // getTextAngle: 0,
      // getTextBackgroundColor: [255, 255, 255, 255],
      // getTextBorderColor: [0, 0, 0, 255],
      // getTextBorderWidth: 0,
      // getTextColor: [0, 0, 0, 255],
      // getTextPixelOffset: [0, 0],
      getTextSize: 8,
      // iconAlphaCutoff: 0.05,
      // iconAtlas: null,
      // iconBillboard: true,
      // iconMapping: {},
      // iconSizeMaxPixels: Number.MAX_SAFE_INTEGER,
      // iconSizeMinPixels: 0,
      // iconSizeScale: 1,
      // iconSizeUnits: 'pixels',
      // lineBillboard: false,
      // lineCapRounded: false,
      // lineJointRounded: false,
      // lineMiterLimit: 4,
      // lineWidthMaxPixels: Number.MAX_SAFE_INTEGER,
      lineWidthMinPixels: 1,
      lineWidthScale: 1,
      lineWidthUnits: "meters",
      // material: true,
      // pointAntialiasing: true,
      // pointBillboard: false,
      // pointRadiusMaxPixels: Number.MAX_SAFE_INTEGER,
      pointRadiusMinPixels: 2,
      pointRadiusScale: 1,
      pointRadiusUnits: "pixels",
      pointType: "circle+text",
      stroked: true,

      // textBackground: false,
      // textBackgroundPadding: [0, 0, 0, 0],
      // textBillboard: true,
      // textCharacterSet: [' ', '!', '"', '#', '$', '%', '&', ''', '(', ')', '*', '+', ',', '-', '.', '/', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?', '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[', '\', ']', '^', '_', '`', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '{', '|', '}', '~', ''],
      // textFontFamily: 'Monaco, monospace',
      // textFontSettings: {},
      // textFontWeight: 'normal',
      // textLineHeight: 1,
      // textMaxWidth: -1,
      // textOutlineColor: [0, 0, 0, 255],
      // textOutlineWidth: 0,
      // textSizeMaxPixels: Number.MAX_SAFE_INTEGER,
      // textSizeMinPixels: 0,
      // textSizeScale: 1,
      // textSizeUnits: 'pixels',
      // textWordBreak: 'break-word',
      // wireframe: false,

      /* props inherited from Layer class */

      autoHighlight: true,
      // coordinateOrigin: [0, 0, 0],
      // coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
      // highlightColor: [0, 0, 128, 128],
      // modelMatrix: null,
      // opacity: 1,
      pickable: true,
      onClick: (event) => {
        setActivePosition({
          lat: event.coordinate![1],
          lng: event.coordinate![0],
        });
        setClickInfo(event);
      },
    }),
    new GeoJsonLayer({
      id: "otherls",
      data: OtherLS,
      extruded: true,
      filled: true,
      getElevation: 30,
      getFillColor: [64, 181, 173, 255],
      // getIconAngle: 0,
      // getIconColor: [0, 0, 0, 255],
      // getIconPixelOffset: [0, 0],
      // getIconSize: 1,
      getLineColor: [0, 0, 0, 255],
      getLineWidth: 1,
      getPointRadius: 5,
      getText: (f: any) => f.properties.Id,
      getTextAlignmentBaseline: "center",
      getTextAnchor: "middle",
      // getTextAngle: 0,
      // getTextBackgroundColor: [255, 255, 255, 255],
      // getTextBorderColor: [0, 0, 0, 255],
      // getTextBorderWidth: 0,
      // getTextColor: [0, 0, 0, 255],
      // getTextPixelOffset: [0, 0],
      getTextSize: 8,
      // iconAlphaCutoff: 0.05,
      // iconAtlas: null,
      // iconBillboard: true,
      // iconMapping: {},
      // iconSizeMaxPixels: Number.MAX_SAFE_INTEGER,
      // iconSizeMinPixels: 0,
      // iconSizeScale: 1,
      // iconSizeUnits: 'pixels',
      // lineBillboard: false,
      // lineCapRounded: false,
      // lineJointRounded: false,
      // lineMiterLimit: 4,
      // lineWidthMaxPixels: Number.MAX_SAFE_INTEGER,
      lineWidthMinPixels: 1,
      lineWidthScale: 1,
      lineWidthUnits: "meters",
      // material: true,
      // pointAntialiasing: true,
      // pointBillboard: false,
      // pointRadiusMaxPixels: Number.MAX_SAFE_INTEGER,
      pointRadiusMinPixels: 2,
      pointRadiusScale: 1,
      pointRadiusUnits: "pixels",
      pointType: "circle+text",
      stroked: true,

      // textBackground: false,
      // textBackgroundPadding: [0, 0, 0, 0],
      // textBillboard: true,
      // textCharacterSet: [' ', '!', '"', '#', '$', '%', '&', ''', '(', ')', '*', '+', ',', '-', '.', '/', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?', '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[', '\', ']', '^', '_', '`', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '{', '|', '}', '~', ''],
      // textFontFamily: 'Monaco, monospace',
      // textFontSettings: {},
      // textFontWeight: 'normal',
      // textLineHeight: 1,
      // textMaxWidth: -1,
      // textOutlineColor: [0, 0, 0, 255],
      // textOutlineWidth: 0,
      // textSizeMaxPixels: Number.MAX_SAFE_INTEGER,
      // textSizeMinPixels: 0,
      // textSizeScale: 1,
      // textSizeUnits: 'pixels',
      // textWordBreak: 'break-word',
      // wireframe: false,

      /* props inherited from Layer class */

      autoHighlight: true,
      // coordinateOrigin: [0, 0, 0],
      // coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
      // highlightColor: [0, 0, 128, 128],
      // modelMatrix: null,
      // opacity: 1,
      pickable: true,
      onClick: (event) => {
        setActivePosition({
          lat: event.coordinate![1],
          lng: event.coordinate![0],
        });
        setClickInfo(event);
      },
    }),
    new GeoJsonLayer({
      id: "privatels",
      data: PrivateLS,
      extruded: true,
      filled: true,
      getElevation: 30,
      getFillColor: [204, 204, 255, 255],
      // getIconAngle: 0,
      // getIconColor: [0, 0, 0, 255],
      // getIconPixelOffset: [0, 0],
      // getIconSize: 1,
      getLineColor: [0, 0, 0, 255],
      getLineWidth: 1,
      getPointRadius: 5,
      getText: (f: any) => f.properties.Id,
      getTextAlignmentBaseline: "center",
      getTextAnchor: "middle",
      // getTextAngle: 0,
      // getTextBackgroundColor: [255, 255, 255, 255],
      // getTextBorderColor: [0, 0, 0, 255],
      // getTextBorderWidth: 0,
      // getTextColor: [0, 0, 0, 255],
      // getTextPixelOffset: [0, 0],
      getTextSize: 8,
      // iconAlphaCutoff: 0.05,
      // iconAtlas: null,
      // iconBillboard: true,
      // iconMapping: {},
      // iconSizeMaxPixels: Number.MAX_SAFE_INTEGER,
      // iconSizeMinPixels: 0,
      // iconSizeScale: 1,
      // iconSizeUnits: 'pixels',
      // lineBillboard: false,
      // lineCapRounded: false,
      // lineJointRounded: false,
      // lineMiterLimit: 4,
      // lineWidthMaxPixels: Number.MAX_SAFE_INTEGER,
      lineWidthMinPixels: 1,
      lineWidthScale: 1,
      lineWidthUnits: "meters",
      // material: true,
      // pointAntialiasing: true,
      // pointBillboard: false,
      // pointRadiusMaxPixels: Number.MAX_SAFE_INTEGER,
      pointRadiusMinPixels: 2,
      pointRadiusScale: 1,
      pointRadiusUnits: "pixels",
      pointType: "circle+text",
      stroked: true,

      // textBackground: false,
      // textBackgroundPadding: [0, 0, 0, 0],
      // textBillboard: true,
      // textCharacterSet: [' ', '!', '"', '#', '$', '%', '&', ''', '(', ')', '*', '+', ',', '-', '.', '/', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?', '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[', '\', ']', '^', '_', '`', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '{', '|', '}', '~', ''],
      // textFontFamily: 'Monaco, monospace',
      // textFontSettings: {},
      // textFontWeight: 'normal',
      // textLineHeight: 1,
      // textMaxWidth: -1,
      // textOutlineColor: [0, 0, 0, 255],
      // textOutlineWidth: 0,
      // textSizeMaxPixels: Number.MAX_SAFE_INTEGER,
      // textSizeMinPixels: 0,
      // textSizeScale: 1,
      // textSizeUnits: 'pixels',
      // textWordBreak: 'break-word',
      // wireframe: false,

      /* props inherited from Layer class */

      autoHighlight: true,
      // coordinateOrigin: [0, 0, 0],
      // coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
      // highlightColor: [0, 0, 128, 128],
      // modelMatrix: null,
      // opacity: 1,
      pickable: true,
      onClick: (event) => {
        setActivePosition({
          lat: event.coordinate![1],
          lng: event.coordinate![0],
        });
        setClickInfo(event);
      },
    }),
  ];
  return (
    <>
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={{ lat: 26.01824, lng: -80.17564 }}
          defaultZoom={14}
          mapId={"1925bbc5ceb21cb3"}
          gestureHandling={"greedy"}
          disableDefaultUI={false}
          scaleControl={true}
          zoomControlOptions={{ position: ControlPosition.LEFT_BOTTOM }}
          streetViewControlOptions={{ position: ControlPosition.LEFT_BOTTOM }}
          onClick={(e) => {
            const latLng = e.detail.latLng;
            if (!latLng) return;
            const pt = { lat: latLng.lat, lng: latLng.lng };
            if (rulerActive) {
              setRulerPoints(prev => {
                if (prev.length >= 2) {
                  setRulerDistance(null);
                  return [pt];
                }
                const next = [...prev, pt];
                if (next.length === 2) computeStreetDistance(next[0], next[1]);
                return next;
              });
            } else if (areaActive) {
              setAreaPoints(prev => [...prev, pt]);
            } else if (infoActive) {
              setInfoPoint(pt);
            } else if (elevationActive) {
              setElevationResult(null);
              fetchElevation(pt.lat, pt.lng);
            } else if (profileActive) {
              setProfilePoints(prev => {
                if (prev.length >= 2) return prev; // already have 2
                const next = [...prev, pt];
                if (next.length === 2) fetchProfile(next[0], next[1]);
                return next;
              });
            }
          }}
        >
          <DeckGlOverlay layers={layers} />
          <RulerOverlay
            active={rulerActive}
            points={rulerPoints}
            distance={rulerDistance}
            onClear={handleRulerClear}
          />
          <AreaOverlay
            active={areaActive}
            points={areaPoints}
            area={areaResult}
            onFinish={handleAreaFinish}
            onClear={handleAreaClear}
          />
          <InfoCursor active={infoActive || elevationActive || profileActive} />
          <ProfileOverlay
            active={profileActive}
            points={profilePoints}
            profileData={profileData}
            loading={profileLoading}
            samples={profileSamples}
            onSamplesChange={setProfileSamples}
            onClear={handleProfileClear}
          />
          <StreetViewPanel
            isOpen={streetViewOpen}
            onClose={() => { setStreetViewOpen(false); setPegmanPos(null); }}
            onActivate={(pos) => { setPegmanPos(pos); setStreetViewOpen(true); }}
            initialPosition={pegmanPos}
            onPositionChange={setStreetViewPos}
            onHeadingChange={setStreetViewHeading}
          />
          {streetViewOpen && streetViewPos && (
            <AdvancedMarker position={streetViewPos}>
              <svg
                width="48"
                height="48"
                viewBox="-24 -24 48 48"
                style={{ display: 'block', overflow: 'visible' }}
              >
                {/* Direction cone rotated by heading */}
                <g transform={`rotate(${streetViewHeading})`}>
                  <path
                    d="M 0 -11 L -11 -30 A 30 30 0 0 1 11 -30 Z"
                    fill="rgba(160,32,240,0.35)"
                    stroke="rgba(160,32,240,0.6)"
                    strokeWidth="1"
                  />
                </g>
                {/* Purple dot */}
                <circle cx="0" cy="0" r="10" fill="#a020f0" stroke="white" strokeWidth="2.5" />
                {/* Small north tick inside dot */}
                <g transform={`rotate(${streetViewHeading})`}>
                  <line x1="0" y1="0" x2="0" y2="-7" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </g>
              </svg>
            </AdvancedMarker>
          )}
          {selectedPlace?.geometry?.location && (
            <AdvancedMarker
              position={{
                lat: selectedPlace.geometry.location.lat(),
                lng: selectedPlace.geometry.location.lng(),
              }}
              title={selectedPlace.formatted_address ?? selectedPlace.name}
            />
          )}
          {clickInfo && (
            <InfoWindow
              position={activePosition}
              onCloseClick={handleInfoWindowClose}
            >
              {(() => {
                const popupCard: React.CSSProperties = {
                  fontFamily: "Arial, sans-serif",
                  minWidth: "210px",
                  overflow: "hidden",
                  borderRadius: "6px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                };
                const popupHeader: React.CSSProperties = {
                  margin: 0,
                  padding: "8px 12px",
                  background: "#1a73e8",
                  color: "#fff",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "0.3px",
                  borderBottom: "none",
                };
                const popupBody: React.CSSProperties = {
                  margin: 0,
                  padding: "8px 12px 10px",
                  color: "#333",
                  fontWeight: "normal",
                  fontSize: "12px",
                  lineHeight: "1.9",
                };
                const popupLink: React.CSSProperties = {
                  color: "#1a73e8",
                  textDecoration: "none",
                  fontWeight: 600,
                };
                if (clickInfo.layer.id === "mh") return (
                  <div style={popupCard}>
                    <h4 style={popupHeader}>Manhole</h4>
                    <p style={popupBody}>
                      <b>Facility ID:</b> {clickInfo.object.properties.FACILITYID} <br />
                      <b>Invert:</b> {clickInfo.object.properties.NAVD88ELEV} <br />
                      <b>RIM:</b> {clickInfo.object.properties.RIMNAVD88} <br />
                      <b>Receivings:</b> {clickInfo.object.properties.RECEIVINGS}
                    </p>
                  </div>
                );
                if (clickInfo.layer.id === "gravity-public-pipe") return (
                  <div style={popupCard}>
                    <h4 style={popupHeader}>Gravity Sewers</h4>
                    <p style={popupBody}>
                      <b>Facility ID:</b> {clickInfo.object.properties.FACILITYID} <br />
                      <b>Diameter (in):</b> {clickInfo.object.properties.DIAMETER} <br />
                      <b>Material:</b> {clickInfo.object.properties.MATERIAL} <br />
                      <b>Length (ft):</b> {Math.round(clickInfo.object.properties.LENGTH)} <br />
                      <b>Zone:</b> {clickInfo.object.properties.ZONE}
                    </p>
                  </div>
                );
                if (clickInfo.layer.id === "development") return (
                  <div style={popupCard}>
                    <h4 style={popupHeader}>Development</h4>
                    <p style={popupBody}>
                      <b>Name:</b> {clickInfo.object.properties.Site} <br />
                      <b>Peak Flow (MGD):</b> {clickInfo.object.properties.Flow}
                    </p>
                  </div>
                );
                if (clickInfo.layer.id === "hollywoodls") return (
                  <div style={popupCard}>
                    <h4 style={popupHeader}>Lift Station (Hollywood)</h4>
                    <p style={popupBody}>
                      <b>Facility ID:</b> {clickInfo.object.properties.FACILITYID} <br />
                      <b>Drawing:</b>{" "}
                      <a style={popupLink} href={"https://storagefoldershazensa.blob.core.windows.net/hollywooddrawing/" + clickInfo.object.properties.FACILITYID + ".pdf"} target="_blank">
                        {clickInfo.object.properties.FACILITYID}
                      </a> <br />
                      <b>Mechanical:</b>{" "}
                      <a style={popupLink} href={"https://storagefoldershazensa.blob.core.windows.net/hollywoodmechanical/" + clickInfo.object.properties.FACILITYID + ".pdf"} target="_blank">
                        {clickInfo.object.properties.FACILITYID}
                      </a> <br />
                      <b>Structural:</b>{" "}
                      <a style={popupLink} href={"https://storagefoldershazensa.blob.core.windows.net/hollywoodstructural/" + clickInfo.object.properties.FACILITYID + ".pdf"} target="_blank">
                        {clickInfo.object.properties.FACILITYID}
                      </a> <br />
                      <b>Pump Curve:</b>{" "}
                      <a style={popupLink} href={"https://storagefoldershazensa.blob.core.windows.net/hollywoodpumpcurve/" + clickInfo.object.properties.FACILITYID + ".pdf"} target="_blank">
                        {clickInfo.object.properties.FACILITYID}
                      </a>
                    </p>
                  </div>
                );
                if (clickInfo.layer.id === "otherls") return (
                  <div style={popupCard}>
                    <h4 style={popupHeader}>Lift Station (Other)</h4>
                    <p style={popupBody}>
                      <b>Name:</b> {clickInfo.object.properties.FACILITYID}
                    </p>
                  </div>
                );
                if (clickInfo.layer.id === "privatels") return (
                  <div style={popupCard}>
                    <h4 style={popupHeader}>Lift Station (Private)</h4>
                    <p style={popupBody}>
                      <b>Name:</b> {clickInfo.object.properties.FACILITYID}
                    </p>
                  </div>
                );
                if (clickInfo.layer.id === "water-only") return (
                  <div style={popupCard}>
                    <h4 style={popupHeader}>Water Only Customer</h4>
                    <p style={popupBody}>
                      <b>Account No:</b> {clickInfo.object.properties.ACCOUNTNUM} <br />
                      <b>Class:</b> {clickInfo.object.properties.CLASS} <br />
                      <b>Meter ID:</b> {clickInfo.object.properties.METER_ID} <br />
                      <b>MGD:</b> {clickInfo.object.properties.MGD}
                    </p>
                  </div>
                );
                if (clickInfo.layer.id === "sewer-only") return (
                  <div style={popupCard}>
                    <h4 style={popupHeader}>Both Water/Sewer Customer</h4>
                    <p style={popupBody}>
                      <b>Account No:</b> {clickInfo.object.properties.ACCOUNTNUM} <br />
                      <b>Class:</b> {clickInfo.object.properties.CLASS} <br />
                      <b>Meter ID:</b> {clickInfo.object.properties.METER_ID} <br />
                      <b>MGD:</b> {clickInfo.object.properties.MGD}
                    </p>
                  </div>
                );
                if (clickInfo.layer.id === "pump") return (
                  <div style={popupCard}>
                    <h4 style={popupHeader}>Pump Station</h4>
                    <p style={popupBody}>
                      <b>Name:</b> {clickInfo.object.properties.Label}
                    </p>
                  </div>
                );
                if (clickInfo.layer.id === "fmpipe") return (
                  <div style={popupCard}>
                    <h4 style={popupHeader}>Force Mains</h4>
                    <p style={popupBody}>
                      <b>Diameter:</b> {clickInfo.object.properties.DIAMETER} <br />
                      <b>Material:</b> {clickInfo.object.properties.MATERIAL}
                    </p>
                  </div>
                );
                if (clickInfo.layer.id === "gravity-private-pipe") return (
                  <div style={popupCard}>
                    <h4 style={popupHeader}>Gravity Pipe (Private)</h4>
                    <p style={popupBody}>
                      <b>Diameter:</b> {clickInfo.object.properties.DIAMETER} <br />
                      <b>Material:</b> {clickInfo.object.properties.MATERIAL}
                    </p>
                  </div>
                );
                if (clickInfo.layer.id === "valve") return (
                  <div style={popupCard}>
                    <h4 style={popupHeader}>Valve</h4>
                    <p style={popupBody}>
                      <b>Elevation (ft):</b> {clickInfo.object.properties.ELEVATION} <br />
                      <b>Setting:</b> {clickInfo.object.properties.SETTING} <br />
                      <b>Zone:</b> {clickInfo.object.properties.ZONE} <br />
                      <b>Diameter (ft):</b> {clickInfo.object.properties.DIAMETER1} <br />
                      <b>Valve Type:</b> {clickInfo.object.properties.VALVE_TYPE}
                    </p>
                  </div>
                );
                if (clickInfo.layer.id === "mhresult") return (
                  <div style={popupCard}>
                    <h4 style={popupHeader}>Manhole</h4>
                    <p style={popupBody}>
                      <b>Flood Depth (ft):</b> {clickInfo.object.properties.FloodDepth} <br />
                      <b>Overflow Volume (G):</b> {clickInfo.object.properties.FLVOL}
                    </p>
                  </div>
                );
                if (clickInfo.layer.id === "piperesult") return (
                  <div style={popupCard}>
                    <h4 style={popupHeader}>Pipe</h4>
                    <p style={popupBody}>
                      <b>d/D:</b> {clickInfo.object.properties.Surcharge} <br />
                      <b>Peak Flow (MGD):</b> {clickInfo.object.properties.Flow}
                    </p>
                  </div>
                );
                return (
                  <div style={popupCard}>
                    <h4 style={popupHeader}>Complaints</h4>
                    <p style={popupBody}>
                      <b>ID:</b> {clickInfo.object.properties.Id}
                    </p>
                  </div>
                );
              })()}
            </InfoWindow>
          )}
        </Map>
        <CustomMapControl
          controlPosition={ControlPosition.TOP}
          selectedAutocompleteMode={selectedAutocompleteMode}
          onPlaceSelect={setSelectedPlace}
        />
        <MapHandler place={selectedPlace} />
      </APIProvider>
      {/* Street View toggle button — fixed top-right */}
      <button
        onClick={() => setStreetViewOpen(o => !o)}
        title="Toggle Street View"
        style={{
          position: "fixed",
          top: 72,
          right: 12,
          zIndex: 1200,
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: streetViewOpen ? "#1a73e8" : "#fff",
          color: streetViewOpen ? "#fff" : "#1a73e8",
          border: "2px solid #1a73e8",
          fontSize: "18px",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.22)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        🚶
      </button>
      {/* Tools speed-dial */}
      <div style={{ position: "fixed", top: 116, right: 12, zIndex: 1200, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        {/* Main toggle button */}
        <button
          onClick={() => setToolsOpen(o => !o)}
          title="Tools"
          style={{
            width: 36, height: 36,
            borderRadius: "50%",
            background: toolsOpen ? "#37474f" : "#fff",
            color: toolsOpen ? "#fff" : "#37474f",
            border: "2px solid #37474f",
            fontSize: 18, fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.22)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.2s",
            transform: toolsOpen ? "rotate(45deg)" : "rotate(0deg)",
          }}
        >
          ✛
        </button>

        {/* Sub-buttons — slide in when toolsOpen */}
        {([
          {
            label: "Ruler", icon: "📏",
            active: rulerActive, color: "#2e7d32",
            onClick: () => {
              if (rulerActive) { handleRulerClear(); }
              else { setRulerActive(true); setAreaActive(false); setAreaPoints([]); setAreaResult(null); setInfoActive(false); setInfoPoint(null); setElevationActive(false); setElevationResult(null); handleProfileClear(); }
            },
          },
          {
            label: "Area", icon: "📐",
            active: areaActive, color: "#e65100",
            onClick: () => {
              if (areaActive) { handleAreaClear(); }
              else { setAreaActive(true); setAreaPoints([]); setAreaResult(null); setRulerActive(false); setRulerPoints([]); setRulerDistance(null); setInfoActive(false); setInfoPoint(null); setElevationActive(false); setElevationResult(null); handleProfileClear(); }
            },
          },
          {
            label: "i", icon: null,
            active: infoActive, color: "#0277bd",
            onClick: () => {
              const next = !infoActive;
              setInfoActive(next);
              if (!next) setInfoPoint(null);
              if (next) { setRulerActive(false); setRulerPoints([]); setRulerDistance(null); setAreaActive(false); setAreaPoints([]); setAreaResult(null); setElevationActive(false); setElevationResult(null); handleProfileClear(); }
            },
          },
          {
            label: "Elevation", icon: "⛰️",
            active: elevationActive, color: "#6a1b9a",
            onClick: () => {
              const next = !elevationActive;
              setElevationActive(next);
              if (!next) setElevationResult(null);
              if (next) { setRulerActive(false); setRulerPoints([]); setRulerDistance(null); setAreaActive(false); setAreaPoints([]); setAreaResult(null); setInfoActive(false); setInfoPoint(null); handleProfileClear(); }
            },
          },
          {
            label: "Profile", icon: "📈",
            active: profileActive, color: "#00796b",
            onClick: () => {
              const next = !profileActive;
              if (!next) { handleProfileClear(); }
              else { setProfileActive(true); setProfilePoints([]); setProfileData(null); setRulerActive(false); setRulerPoints([]); setRulerDistance(null); setAreaActive(false); setAreaPoints([]); setAreaResult(null); setInfoActive(false); setInfoPoint(null); setElevationActive(false); setElevationResult(null); }
            },
          },
        ] as const).map(({ label, icon, active, color, onClick }) => (
          <div
            key={label}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              opacity: toolsOpen ? 1 : 0,
              transform: toolsOpen ? "translateX(0)" : "translateX(20px)",
              transition: "opacity 0.2s, transform 0.2s",
              pointerEvents: toolsOpen ? "auto" : "none",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: "#555", fontFamily: "Arial, sans-serif", background: "rgba(255,255,255,0.9)", padding: "2px 6px", borderRadius: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }}>
              {label}
            </span>
            <button
              onClick={onClick}
              title={label}
              style={{
                width: 34, height: 34,
                borderRadius: "50%",
                background: active ? color : "#fff",
                color: active ? "#fff" : color,
                border: `2px solid ${color}`,
                fontSize: icon ? 15 : 13,
                fontWeight: 700,
                fontFamily: "Arial, sans-serif",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {icon ?? label}
            </button>
          </div>
        ))}
      </div>

      {/* Coordinates result panel */}
      {infoPoint && (
        <div
          style={{
            position: "fixed",
            bottom: 36,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255,255,255,0.97)",
            padding: "9px 18px",
            borderRadius: 10,
            boxShadow: "0 4px 16px rgba(0,0,0,0.22)",
            zIndex: 1300,
            fontFamily: "Arial, sans-serif",
            fontSize: 14,
            fontWeight: 700,
            color: "#333",
            display: "flex",
            alignItems: "center",
            gap: 12,
            border: "1px solid rgba(2,119,189,0.25)",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 15 }}>📍</span>
          <span>
            <span style={{ color: "#0277bd" }}>Lat:</span>{" "}
            {infoPoint.lat.toFixed(6)}
            &nbsp;&nbsp;
            <span style={{ color: "#0277bd" }}>Lng:</span>{" "}
            {infoPoint.lng.toFixed(6)}
          </span>
          <button
            onClick={() => setInfoPoint(null)}
            title="Clear"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#888",
              fontSize: 16,
              lineHeight: 1,
              padding: "0 2px",
              marginLeft: 4,
            }}
          >
            ✕
          </button>
        </div>
      )}
      {/* Elevation result panel */}
      {elevationActive && (
        <div
          style={{
            position: "fixed",
            bottom: 36,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255,255,255,0.97)",
            padding: "9px 18px",
            borderRadius: 10,
            boxShadow: "0 4px 16px rgba(0,0,0,0.22)",
            zIndex: 1300,
            fontFamily: "Arial, sans-serif",
            fontSize: 14,
            fontWeight: 700,
            color: "#333",
            display: "flex",
            alignItems: "center",
            gap: 12,
            border: "1px solid rgba(106,27,154,0.25)",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 15 }}>⛰️</span>
          {elevationResult ? (
            <span>
              <span style={{ color: "#6a1b9a" }}>Elevation:</span>{" "}
              {elevationResult.meters.toFixed(1)} m
              {" / "}
              {(elevationResult.meters * 3.28084).toFixed(1)} ft
              <span style={{ color: "#888", fontWeight: 400, fontSize: 12, marginLeft: 8 }}>
                ({elevationResult.lat.toFixed(6)}, {elevationResult.lng.toFixed(6)})
              </span>
            </span>
          ) : (
            <span style={{ color: "#6a1b9a", fontWeight: 400 }}>Click a point on the map</span>
          )}
          <button
            onClick={() => { setElevationActive(false); setElevationResult(null); }}
            title="Close"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#888",
              fontSize: 16,
              lineHeight: 1,
              padding: "0 2px",
              marginLeft: 4,
            }}
          >
            ✕
          </button>
        </div>
      )}
      {/* Toggle button for the two left-side panels */}
      <button
        onClick={() => setOpen1(o => !o)}
        title={open1 ? "Hide layers" : "Show layers"}
        style={{
          position: "absolute",
          top: 85,
          left: 10,
          zIndex: 10,
          background: open1 ? "#1a73e8" : "rgba(255,255,255,0.96)",
          color: open1 ? "#fff" : "#1a73e8",
          border: "2px solid #1a73e8",
          borderRadius: 8,
          padding: "5px 12px",
          fontSize: 12,
          fontWeight: 700,
          fontFamily: "Arial, sans-serif",
          letterSpacing: "0.05em",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ fontSize: 14 }}>{open1 ? "◀" : "▶"}</span>
        Layers
      </button>

      {open1 && (
      <>
      <FormControl
        component="fieldset"
        style={{
          position: "absolute",
          top: 125,
          left: 10,
          background: "rgba(255,255,255,0.96)",
          margin: 0,
          borderRadius: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10)",
          border: "1px solid rgba(26,115,232,0.18)",
          padding: "6px 14px 10px",
          minWidth: 175,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            color: "#1a73e8",
            marginBottom: 4,
            paddingBottom: 6,
            borderBottom: "2px solid rgba(26,115,232,0.18)",
            fontFamily: "Arial, sans-serif",
          }}
        >
          Map Layer
        </div>
        <RadioGroup
          aria-label="gender"
          name="gender1"
          value={age}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setAge(event.target.value);
            if (event.target.value === "default") {
              setShow1(true);
              setShow2(false);
              setShow3(false);
              setShow4(false);
              setShow5(true);
            } else if (event.target.value === "mdd") {
              setShow1(false);
              setShow2(true);
              setShow3(false);
              setShow4(false);
              setShow5(false);
            } else if (event.target.value === "add") {
              setShow1(true);
              setShow2(false);
              setShow3(true);
              setShow4(false);
              setShow5(true);
            } else if (event.target.value === "material") {
              setShow1(true);
              setShow2(false);
              setShow3(false);
              setShow4(false);
              setShow5(true);
            } else if (event.target.value === "zone") {
              setShow1(true);
              setShow2(false);
              setShow3(false);
              setShow4(false);
              setShow5(true);
            } else if (event.target.value === "fire") {
              setShow1(true);
              setShow2(false);
              setShow3(false);
              setShow4(true);
              setShow5(true);
            } else {
              setShow1(false);
              setShow2(true);
              setShow3(false);
              setShow4(false);
              setShow5(false);
            }
          }}
          // renderValue={(selected) => {
          //   if (selected) return age;
          // }}
        >
          <FormControlLabel
            value="default"
            label="Default"
            control={<Radio />}
            componentsProps={{ typography: { variant: "h6", fontSize: 15 } }}
          />
          <FormControlLabel
            value="mdd"
            label="2Y Storm"
            control={<Radio />}
            componentsProps={{ typography: { variant: "h6", fontSize: 15 } }}
          />

          <FormControlLabel
            value="material"
            label="Pipe Material"
            control={<Radio />}
            componentsProps={{ typography: { variant: "h6", fontSize: 15 } }}
          />
        
        </RadioGroup>
      </FormControl>
      <FormGroup
        style={{
          position: "absolute",
          top: 310,
          left: 10,
          background: "rgba(255,255,255,0.96)",
          margin: 0,
          borderRadius: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10)",
          border: "1px solid rgba(26,115,232,0.18)",
          padding: "6px 14px 10px",
          minWidth: 175,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.09em",
            textTransform: "uppercase",
            color: "#1a73e8",
            marginBottom: 4,
            paddingBottom: 6,
            borderBottom: "2px solid rgba(26,115,232,0.18)",
            fontFamily: "Arial, sans-serif",
          }}
        >
          Overlays
        </div>
        <FormControlLabel
          control={
            <Checkbox checked={round} onChange={handleRoundChange} name="one" />
          }
          label="Customers"
        />
        <FormControlLabel
          control={
            <Checkbox checked={develop} onChange={handleDevelop} name="two" />
          }
          label="Developments"
        />
      </FormGroup>
      </>
      )}
    </>
  );
};

export default App;

export function renderToDom(container: HTMLElement) {
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
