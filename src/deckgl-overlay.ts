import {useMap} from '@vis.gl/react-google-maps';
import {useEffect, useMemo} from 'react';

import {GoogleMapsOverlay} from '@deck.gl/google-maps/typed';

import type {LayersList} from '@deck.gl/core/typed';

export type DeckglOverlayProps = {layers?: LayersList};

/**
 * A very simple implementation of a component that renders a list of deck.gl layers
 * via the GoogleMapsOverlay into the <Map> component containing it.
 */
export const DeckGlOverlay = ({layers}: DeckglOverlayProps) => {
  // the GoogleMapsOverlay can persist throughout the lifetime of the DeckGlOverlay
  const deck = useMemo(() => new GoogleMapsOverlay({
    interleaved: true, 
    getTooltip: ({ object,layer}) => (object &&
      layer?.id === "mh" && {
        html: `\
    <div id="showup">
    Manhole <br>
    Facility ID: ${object.properties.FACILITYID}<br>
    Rim (ft): ${object.properties.RIMNAVD88}<br>
    Invert (ft): ${object.properties.NAVD88ELEV}<br>
    Receivings: ${object.properties.RECEIVINGS}<br>
    </div>

`,
        style: {
          backgroundColor: "#FFFFFF",
          color: "#FF69B4",
          fontSize: "15px",
          fontWeight: "bold",
          width: "200px",
        },
      }) ||
    (object &&
      layer?.id === "gravity-public-pipe" && {
        html: `\
    <div id="showup">
    Gravity Sewer<br>
    Facility ID: ${object.properties.FACILITYID}<br>
    Diameter: ${object.properties.DIAMETER}<br>
    Material: ${object.properties.MATERIAL}<br>
    
    </div>

`,
        style: {
          backgroundColor: "#FFFFFF",
          color: "#DA70D6",
          fontSize: "15px",
          fontWeight: "bold",
          width: "150px",
        },
      }) ||
      (object &&
            layer?.id === "rac" && {
              html: `\
              <div id="showup">
              RAC<br>
              LandUse: ${object.properties.LANDUSE}<br>
              Owner: ${object.properties.NAME_LINE_}<br>
              Use Code: ${object.properties.USE_CODE}<br>
  
              </div>
  
        `,
              style: {
                backgroundColor: "#FFFFFF",
                color: "#DA70D6",
                fontSize: "15px",
                fontWeight: "bold",
              },
            }) ||
    (object &&
      layer?.id === "development" && {
        html: `\
            <div id="showup">
            Development Projects<br>
            Name: ${object.properties.Site}<br>
            Peak Flow (MGD): ${object.properties.Flow}<br>
            


            </div>

      `,
        style: {
          backgroundColor: "#FFFFFF",
          color: "#008080",
          fontSize: "15px",
          fontWeight: "bold",
          width: "150px",
        },
      }) ||
    (object &&
      layer?.id === "pump" && {
        html: `\
            <div id="showup">
            Pump<br>
            Name: ${object.properties.Label}<br>
            </div>

      `,
        style: {
          backgroundColor: "#FFFFFF",
          color: "#DA70D6",
          fontSize: "15px",
          fontWeight: "bold",
          width: "150px",
        },
      }) ||
      (object &&
        layer?.id === "water-only" && {
          html: `\
              <div id="showup">
              Water Only Customers<br>
              Account No: ${object.properties.ACCOUNTNUM}<br>
              Class: ${object.properties.CLASS}<br>
              Meter ID: ${object.properties.METER_ID}<br>
              MGD: ${object.properties.MGD}<br>
              </div>
  
        `,
          style: {
            backgroundColor: "#FFFFFF",
            color: "#DA70D6",
            fontSize: "12px",
            fontWeight: "bold",
            width: "150px",
          },
        }) ||
        (object &&
          layer?.id === "sewer-only" && {
            html: `\
                <div id="showup">
                Both Water/Sewer Customers<br>
                Account No: ${object.properties.ACCOUNTNUM}<br>
                Class: ${object.properties.CLASS}<br>
                Meter ID: ${object.properties.METER_ID}<br>
                MGD: ${object.properties.MGD}<br>
                </div>
    
          `,
            style: {
              backgroundColor: "#FFFFFF",
              color: "#00A36C",
              fontSize: "12px",
              fontWeight: "bold",
              width: "150px",
            },
          }) ||
          (object &&
            layer?.id === "broward" && {
              html: `\
                  <div id="showup">
                  Broward Sewer Only User<br>
              
                  MGD: ${object.properties.MGD}<br>
                  </div>
      
            `,
              style: {
                backgroundColor: "#FFFFFF",
                color: "#3F00FF",
                fontSize: "12px",
                fontWeight: "bold",
                width: "150px",
              },
            }) ||
      (object &&
        layer?.id === "gravity-private-pipe" && {
          html: `\
              <div id="showup">
              Gravity Pipe (Private)<br>
              Diameter: ${object.properties.DIAMETER}<br>
              Material: ${object.properties.MATERIAL}<br>
              </div>
  
        `,
          style: {
            backgroundColor: "#FFFFFF",
            color: "#DA70D6",
            fontSize: "15px",
            fontWeight: "bold",
            width: "150px",
          },
        }) ||
    (object &&
      layer?.id === "hollywoodls" && {
        html: `\
              <div id="showup">
              Lift Station (Hollywood)<br>
              Name: ${object.properties.FACILITYID}<br>
           
              </div>
  
        `,
        style: {
          backgroundColor: "#FFFFFF",
          color: "#0F52BA",
          fontSize: "15px",
          fontWeight: "bold",
          width: "150px",
        },
      }) ||
      (object &&
        layer?.id === "otherls" && {
          html: `\
                <div id="showup">
                Lift Station (Other)<br>
                Name: ${object.properties.FACILITYID}<br>
             
                </div>
    
          `,
          style: {
            backgroundColor: "#FFFFFF",
            color: "#0F52BA",
            fontSize: "15px",
            fontWeight: "bold",
            width: "150px",
          },
        }) ||
        (object &&
          layer?.id === "privatels" && {
            html: `\
                  <div id="showup">
                  Lift Station (Private)<br>
                  Name: ${object.properties.FACILITYID}<br>
               
                  </div>
      
            `,
            style: {
              backgroundColor: "#FFFFFF",
              color: "#0F52BA",
              fontSize: "15px",
              fontWeight: "bold",
              width: "150px",
            },
          }) ||
    
    (object &&
      layer?.id === "mh" && {
        html: `\
                <div id="showup">
                <u>Node</u><br>
                Demand: ${object.properties.DEMAND}<br>
                Elevation (ft): ${object.properties.ELEVATION}<br>
                MDD Pressure (psi): ${Math.round(
                  object.properties.MAX_PRESS
                )}<br>
                
                </div>
    
          `,
        style: {
          backgroundColor: "#FFFFFF",
          color: "#CC7722",
          fontSize: "15px",
          fontWeight: "bold",
          width: "200px",
        },
      }) ||
      (object &&
        layer?.id === "mhresult" && {
          html: `\
                  <div id="showup">
                  <u>Node</u><br>
                  Flood Depth (ft): ${object.properties.FloodDepth}<br>
                  Overflow Volume (G): ${object.properties.FLVOL}<br>
                  
                  
                  </div>
      
            `,
          style: {
            backgroundColor: "#FFFFFF",
            color: "#CC7722",
            fontSize: "15px",
            fontWeight: "bold",
            width: "200px",
          },
        }) ||
        (object &&
          layer?.id === "piperesult" && {
            html: `\
                    <div id="showup">
                    <u>Pipe</u><br>
                    d/D: ${object.properties.Surcharge}<br>
                    Peak Flow (MGD): ${object.properties.Flow}<br>
                    
                    
                    </div>
        
              `,
            style: {
              backgroundColor: "#FFFFFF",
              color: "#CC7722",
              fontSize: "15px",
              fontWeight: "bold",
              width: "200px",
            },
          }) ||
    
    (object &&
      layer?.id === "fmpipe" && {
        html: `\
                    <div id="showup">
                    <u>Force Mains</u><br>
                    Diameter (in): ${
                      object.properties.DIAMETER
                    }<br>
                    Material: ${
                      object.properties.MATERIAL
                    }<br>
                    
                    </div>
        
              `,
        style: {
          backgroundColor: "#FFFFFF",
          color: "#CC7722",
          fontSize: "15px",
          fontWeight: "bold",
          width: "150px",
        },
      }),
  }), []);

  // add the overlay to the map once the map is available
  const map = useMap();
  useEffect(() => {
    deck.setMap(map);

    return () => deck.setMap(null);
  }, [deck, map]);

  // whenever the rendered data changes, the layers will be updated
  useEffect(() => {
    deck.setProps({layers});
  }, [deck, layers]);

  // no dom rendered by this component
  return null;
};
