import type { ThermalEvent, Facility, SystemStatistics } from "../types";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined" && window.location.port === "5173"
    ? "http://localhost:8000/api"
    : "/api");

export type TelemetryDataStatus = "live" | "cached" | "mock_fallback" | "error";

export interface ApiFetchResult<T> {
  data: T | null;
  error: string | null;
  isMock: boolean;
  status: TelemetryDataStatus;
}

// Development fallback dataset for Giaspura study area, clearly identified
const MOCK_EVENTS: ThermalEvent[] = [
  {
    id: "EVT-202609-001",
    latitude: 30.8762,
    longitude: 75.8991,
    detection_time: "2026-09-15T12:45:00Z",
    frp: 28.4,
    brightness: 348.6,
    satellite: "VIIRS / NOAA-20",
    classification: "Probable Industrial Fire",
    classification_method: "Evidence-Based Assessment",
    confidence: 88,
    risk_score: 92,
    priority: "HIGH",
    is_persistent: false,
    historical_detection_count: 3,
    land_cover: "Industrial / Fabricated Structure",
    nearest_facility: {
      id: "FAC-GIAS-01",
      name: "Giaspura Metal Finishing Works",
      facility_type: "Electroplating & Heat Treatment",
      distance_meters: 65,
      distance_km: 0.065,
    },
    evidence: [
      "Located within 65m of high-risk electroplating facility perimeter",
      "FRP spike of 28.4 MW exceeds typical baseline in industrial zone",
      "Abrupt thermal onset with high localized brightness (348.6 K)",
      "High population density immediate vicinity in Giaspura sector",
    ],
  },
  {
    id: "EVT-202609-002",
    latitude: 30.8718,
    longitude: 75.8932,
    detection_time: "2026-09-15T10:15:00Z",
    frp: 8.2,
    brightness: 319.4,
    satellite: "VIIRS / NOAA-20",
    classification: "Probable Persistent Industrial Thermal Source",
    classification_method: "Evidence-Based Assessment",
    confidence: 94,
    risk_score: 46,
    priority: "MEDIUM",
    is_persistent: true,
    historical_detection_count: 24,
    land_cover: "Heavy Industrial Foundry",
    nearest_facility: {
      id: "FAC-GIAS-02",
      name: "Oswal Casting & Forging Complex",
      facility_type: "Foundry & Furnace",
      distance_meters: 30,
      distance_km: 0.03,
    },
    evidence: [
      "Consistent heat signature observed on 24 historical satellite passes",
      "Correlates with registered furnace operation schedule",
      "Thermal boundary confined to documented smelting stack",
    ],
  },
  {
    id: "EVT-202609-003",
    latitude: 30.8845,
    longitude: 75.9082,
    detection_time: "2026-09-15T08:30:00Z",
    frp: 16.5,
    brightness: 331.0,
    satellite: "VIIRS / Suomi-NPP",
    classification: "Probable Agricultural Burning",
    classification_method: "Evidence-Based Assessment",
    confidence: 76,
    risk_score: 55,
    priority: "MEDIUM",
    is_persistent: false,
    historical_detection_count: 2,
    land_cover: "Agricultural / Cropland Peripheral",
    nearest_facility: {
      id: "FAC-GIAS-03",
      name: "Perimeter Grain Silos",
      facility_type: "Agri-Storage",
      distance_meters: 620,
      distance_km: 0.62,
    },
    evidence: [
      "Open field spectral signature beyond urban containment line",
      "Moderate FRP typical of seasonal crop residue clearing",
      "No adjacent manufacturing structures within 500m radius",
    ],
  },
  {
    id: "EVT-202609-004",
    latitude: 30.8652,
    longitude: 75.8821,
    detection_time: "2026-09-15T04:20:00Z",
    frp: 4.1,
    brightness: 308.2,
    satellite: "VIIRS / NOAA-20",
    classification: "Unclassified Thermal Anomaly",
    classification_method: null,
    confidence: 52,
    risk_score: 28,
    priority: "LOW",
    is_persistent: false,
    historical_detection_count: 1,
    land_cover: "Open Mixed / Transportation Corridor",
    nearest_facility: null,
    evidence: [
      "Low intensity anomaly near transport interchange",
      "Single detection without previous thermal history",
    ],
  },
];

const MOCK_FACILITIES: Facility[] = [
  {
    id: "FAC-GIAS-01",
    name: "Giaspura Metal Finishing Works",
    facility_type: "Electroplating & Chemical Treatment",
    latitude: 30.8758,
    longitude: 75.8988,
    address: "Phase VI, Focal Point, Giaspura, Ludhiana",
    sector: "Chemicals / Metals",
  },
  {
    id: "FAC-GIAS-02",
    name: "Oswal Casting & Forging Complex",
    facility_type: "Foundry & Furnace",
    latitude: 30.872,
    longitude: 75.8935,
    address: "Dhandari Kalan - Giaspura Link Rd, Ludhiana",
    sector: "Heavy Metallurgy",
  },
  {
    id: "FAC-GIAS-03",
    name: "Perimeter Grain Silos",
    facility_type: "Agri-Storage",
    latitude: 30.885,
    longitude: 75.9085,
    address: "Eastern Agricultural Buffer, Giaspura Outer",
    sector: "Agri-Logistics",
  },
  {
    id: "FAC-GIAS-04",
    name: "Sutlej Textile Dyeing Unit",
    facility_type: "Boiler & Textile Processing",
    latitude: 30.8785,
    longitude: 75.8912,
    address: "Street No. 4, Giaspura Industrial Area",
    sector: "Textile & Dyeing",
  },
];

const MOCK_STATS: SystemStatistics = {
  active_events: 4,
  industrial_events: 1,
  persistent_sources: 1,
  natural_events: 0,
  agricultural_events: 1,
  high_priority_events: 1,
  last_updated: "2026-09-15T13:00:00Z",
};

// Cache helpers
function getCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCached<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

// Generic fetcher with caching and fallback support
async function apiRequest<T>(
  endpoint: string,
  cacheKey: string,
  fallbackData: T | null = null
): Promise<ApiFetchResult<T>> {
  const url = `${API_BASE_URL.replace(/\/$/, "")}${endpoint}`;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = (await response.json()) as T;
      setCached(cacheKey, data);
      return {
        data,
        error: null,
        isMock: false,
        status: "live",
      };
    } else {
      throw new Error(`Server returned ${response.status} ${response.statusText}`);
    }
  } catch (err: any) {
    // 1. Try returning cached data if available
    const cached = getCached<T>(cacheKey);
    if (cached !== null) {
      return {
        data: cached,
        error: `Backend unreachable (${err.message}). Displaying cached observation data.`,
        isMock: false,
        status: "cached",
      };
    }

    // 2. If no cached data and fallback is provided, use clearly labeled mock fallback
    if (fallbackData !== null) {
      return {
        data: fallbackData,
        error: err.message || "Failed to reach backend API",
        isMock: true,
        status: "mock_fallback",
      };
    }

    // 3. Absolute error state
    return {
      data: null,
      error: err.message || "API request failed",
      isMock: false,
      status: "error",
    };
  }
}

export const api = {
  /**
   * GET /api/active-events
   */
  async getActiveEvents(): Promise<ApiFetchResult<ThermalEvent[]>> {
    return apiRequest<ThermalEvent[]>("/active-events", "fiery_cache_events", MOCK_EVENTS);
  },

  /**
   * GET /api/events/{event_id}
   */
  async getEventById(eventId: string): Promise<ApiFetchResult<ThermalEvent>> {
    const fallback = MOCK_EVENTS.find((e) => e.id === eventId) || null;
    return apiRequest<ThermalEvent>(
      `/events/${encodeURIComponent(eventId)}`,
      `fiery_cache_event_${eventId}`,
      fallback
    );
  },

  /**
   * GET /api/facilities
   */
  async getFacilities(): Promise<ApiFetchResult<Facility[]>> {
    return apiRequest<Facility[]>("/facilities", "fiery_cache_facilities", MOCK_FACILITIES);
  },

  /**
   * GET /api/statistics
   */
  async getStatistics(): Promise<ApiFetchResult<SystemStatistics>> {
    return apiRequest<SystemStatistics>("/statistics", "fiery_cache_stats", MOCK_STATS);
  },
};
