import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ThermalEvent, Facility } from "../types";
import { getClassificationInfo } from "../utils/colors";
import { Legend } from "./Legend";
import { Crosshair } from "lucide-react";

interface MapProps {
  events: ThermalEvent[];
  facilities: Facility[];
  selectedEvent: ThermalEvent | null;
  onSelectEvent: (event: ThermalEvent) => void;
  showFacilities: boolean;
  isLoading: boolean;
  zeroEventsMessage?: string;
}

const GIASPURA_CENTER: [number, number] = [30.875625, 75.898481];
const GIASPURA_ZOOM = 14;

// Study Area Bounds: [south-west, north-east]
const GIASPURA_STUDY_BOUNDS: [[number, number], [number, number]] = [
  [30.855, 75.870],
  [30.898, 75.925],
];

// Basemap definitions: High quality, no-watermark, reliable tile providers
// Optional environment key can be supplied via VITE_MAP_TILE_KEY without hardcoding
const MAP_KEY = import.meta.env.VITE_MAP_TILE_KEY || "";

const BASEMAP_CONFIGS = {
  dark: {
    base: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    labels: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
    maxZoom: 16,
  },
  osm: {
    base: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    labels: null,
    attribution: "&copy; OpenStreetMap contributors",
    maxZoom: 19,
  },
  satellite: {
    base: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    labels: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
    maxZoom: 18,
  },
  carto_custom: {
    base: MAP_KEY
      ? `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?api_key=${MAP_KEY}`
      : "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    labels: null,
    attribution: "&copy; CartoDB",
    maxZoom: 19,
  },
};

export const Map: React.FC<MapProps> = ({
  events,
  facilities,
  selectedEvent,
  onSelectEvent,
  showFacilities,
  isLoading,
  zeroEventsMessage,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const baseTileLayerRef = useRef<L.TileLayer | null>(null);
  const labelTileLayerRef = useRef<L.TileLayer | null>(null);
  const eventLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const facilityLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const boundaryLayerRef = useRef<L.Rectangle | null>(null);

  const [activeBasemap, setActiveBasemap] = useState<"dark" | "osm" | "satellite">("dark");

  // Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: GIASPURA_CENTER,
      zoom: GIASPURA_ZOOM,
      zoomControl: false,
      attributionControl: false,
    });

    // Custom zoom control
    L.control
      .zoom({
        position: "topleft",
      })
      .addTo(map);

    // Scale control
    L.control
      .scale({
        imperial: false,
        position: "bottomleft",
      })
      .addTo(map);

    // Base dark layer (no watermark, clean dark gray)
    const baseLayer = L.tileLayer(BASEMAP_CONFIGS.dark.base, {
      maxZoom: BASEMAP_CONFIGS.dark.maxZoom,
      attribution: BASEMAP_CONFIGS.dark.attribution,
    }).addTo(map);

    // Reference labels layer
    const labelLayer = L.tileLayer(BASEMAP_CONFIGS.dark.labels, {
      maxZoom: BASEMAP_CONFIGS.dark.maxZoom,
      pane: "shadowPane", // Keep below markers
    }).addTo(map);

    // Study boundary rectangle
    const boundary = L.rectangle(GIASPURA_STUDY_BOUNDS, {
      color: "#0284c7",
      weight: 2,
      dashArray: "6, 6",
      fillColor: "#0284c7",
      fillOpacity: 0.04,
    }).addTo(map);

    boundary.bindTooltip("Giaspura Study Area Boundary", {
      sticky: true,
      className: "fiery-map-tooltip",
    });

    // Layer groups for markers
    const eventLayerGroup = L.layerGroup().addTo(map);
    const facilityLayerGroup = L.layerGroup().addTo(map);

    mapRef.current = map;
    baseTileLayerRef.current = baseLayer;
    labelTileLayerRef.current = labelLayer;
    eventLayerGroupRef.current = eventLayerGroup;
    facilityLayerGroupRef.current = facilityLayerGroup;
    boundaryLayerRef.current = boundary;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update basemap when user toggles
  useEffect(() => {
    if (!mapRef.current) return;
    const cfg = BASEMAP_CONFIGS[activeBasemap];

    if (baseTileLayerRef.current) {
      baseTileLayerRef.current.setUrl(cfg.base);
      baseTileLayerRef.current.options.maxZoom = cfg.maxZoom;
    }

    if (cfg.labels) {
      if (!labelTileLayerRef.current) {
        labelTileLayerRef.current = L.tileLayer(cfg.labels, {
          maxZoom: cfg.maxZoom,
          pane: "shadowPane",
        }).addTo(mapRef.current);
      } else {
        labelTileLayerRef.current.setUrl(cfg.labels);
      }
    } else if (labelTileLayerRef.current) {
      mapRef.current.removeLayer(labelTileLayerRef.current);
      labelTileLayerRef.current = null;
    }
  }, [activeBasemap]);

  // Update Event Markers & Ensure Click Reliability
  useEffect(() => {
    if (!eventLayerGroupRef.current) return;
    eventLayerGroupRef.current.clearLayers();

    events.forEach((evt) => {
      const classInfo = getClassificationInfo(evt.classification);
      const isSelected = selectedEvent?.id === evt.id;
      const isHighPriority = evt.priority?.toUpperCase() === "HIGH";

      // Scale marker size based on FRP (20px to 34px)
      const baseSize = Math.min(34, Math.max(22, 20 + Math.sqrt(evt.frp || 1) * 2));
      const pulseHtml = isHighPriority
        ? `<span class="marker-pulse-ring" style="border-color: ${classInfo.color}"></span>`
        : "";

      const markerHtml = `
        <div class="custom-thermal-marker ${isSelected ? "is-selected" : ""} ${isHighPriority ? "is-high-priority" : ""}" style="width: ${baseSize}px; height: ${baseSize}px;" data-event-id="${evt.id}">
          ${pulseHtml}
          <div class="marker-core" style="background-color: ${classInfo.color}; box-shadow: 0 0 10px ${classInfo.color};">
            <span class="marker-frp-text">${Math.round(evt.frp)}</span>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: "fiery-marker-wrapper",
        html: markerHtml,
        iconSize: [baseSize, baseSize],
        iconAnchor: [baseSize / 2, baseSize / 2],
      });

      const marker = L.marker([evt.latitude, evt.longitude], {
        icon,
        interactive: true,
        riseOnHover: true,
        // Thermal alerts take visual precedence over industrial facility icons.
        // A fixed offset prevents their colour from being obscured at overlaps.
        zIndexOffset: 10000,
      });

      marker.bindTooltip(
        `<div class="marker-tooltip-content">
            <div class="tooltip-id"><strong>${evt.id}</strong> (Click to view)</div>
            <div class="tooltip-class" style="color: ${classInfo.color}">${classInfo.label}</div>
            <div class="tooltip-meta">FRP: <strong>${evt.frp} MW</strong> | Priority: <strong>${evt.priority || "N/A"}</strong></div>
          </div>`,
        {
          direction: "top",
          offset: [0, -baseSize / 2],
          className: "fiery-map-tooltip",
        }
      );

      // Explicit click handler to open drawer
      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectEvent(evt);
        if (mapRef.current) {
          mapRef.current.panTo([evt.latitude, evt.longitude], { animate: true });
        }
      });

      eventLayerGroupRef.current?.addLayer(marker);
    });
  }, [events, selectedEvent, onSelectEvent]);

  // Update Facility Markers
  useEffect(() => {
    if (!facilityLayerGroupRef.current) return;
    facilityLayerGroupRef.current.clearLayers();

    if (!showFacilities) return;

    facilities.forEach((fac) => {
      const iconHtml = `
        <div class="custom-facility-marker" title="${fac.name}">
          <div class="facility-marker-inner">
            <span class="facility-icon-symbol">🏭</span>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        className: "fiery-facility-wrapper",
        html: iconHtml,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([fac.latitude, fac.longitude], {
        icon,
        interactive: true,
        // Facilities remain visible context, but sit below thermal alerts.
        zIndexOffset: 0,
      });

      marker.bindTooltip(
        `<div class="facility-tooltip-content">
            <div class="tooltip-name"><strong>${fac.name}</strong></div>
            <div class="tooltip-type">${fac.facility_type}</div>
            ${fac.address ? `<div class="tooltip-address">${fac.address}</div>` : ""}
          </div>`,
        {
          direction: "top",
          offset: [0, -13],
          className: "fiery-facility-tooltip",
        }
      );

      facilityLayerGroupRef.current?.addLayer(marker);
    });
  }, [facilities, showFacilities]);

  // Recenter helper
  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.flyTo(GIASPURA_CENTER, GIASPURA_ZOOM, {
        duration: 0.8,
      });
    }
  };

  return (
    <div className="map-view-wrapper">
      <div ref={mapContainerRef} className="leaflet-map-canvas" />

      {/* Floating Basemap & Recenter Controls */}
      <div className="map-overlay-tools">
        <button
          className="map-tool-btn"
          onClick={handleRecenter}
          title="Recenter to Giaspura"
          aria-label="Recenter to Giaspura"
        >
          <Crosshair size={16} />
          <span className="tool-btn-label">Giaspura Center</span>
        </button>

        <div className="basemap-selector-pill">
          <button
            className={`basemap-opt-btn ${activeBasemap === "dark" ? "active" : ""}`}
            onClick={() => setActiveBasemap("dark")}
            title="Clean Dark Basemap (No Watermark)"
          >
            Dark
          </button>
          <button
            className={`basemap-opt-btn ${activeBasemap === "osm" ? "active" : ""}`}
            onClick={() => setActiveBasemap("osm")}
            title="OpenStreetMap Standard"
          >
            Street (OSM)
          </button>
          <button
            className={`basemap-opt-btn ${activeBasemap === "satellite" ? "active" : ""}`}
            onClick={() => setActiveBasemap("satellite")}
            title="Satellite Imagery"
          >
            Satellite
          </button>
        </div>
      </div>

      {/* Floating Legend */}
      <Legend />

      {/* Zero Events State Banner Overlay */}
      {!isLoading && events.length === 0 && (
        <div className="map-zero-events-banner">
          <div className="zero-events-card">
            <span className="zero-events-icon">📡</span>
            <div className="zero-events-content">
              <h4>Giaspura Observation Window</h4>
              <p>
                {zeroEventsMessage ||
                  "No active thermal anomalies detected in the latest available observation window."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="map-loading-indicator">
          <div className="loading-spinner" />
          <span>Synchronizing Giaspura Telemetry...</span>
        </div>
      )}
    </div>
  );
};
