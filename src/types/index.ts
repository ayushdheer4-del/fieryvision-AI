export type ClassificationType =
  | "Probable Industrial Fire"
  | "Probable Persistent Industrial Thermal Source"
  | "Probable Agricultural Burning"
  | "Probable Natural / Forest Fire"
  | "Other / Unknown"
  | "Unclassified Thermal Anomaly";

export type PriorityType = "HIGH" | "MEDIUM" | "LOW";

export interface NearestFacility {
  id?: string;
  name?: string;
  facility_type?: string;
  distance_meters?: number;
  distance_km?: number;
}

export interface ThermalEvent {
  id: string;
  latitude: number;
  longitude: number;
  detection_time: string;
  frp: number; // Fire Radiative Power in MW
  brightness?: number | null; // Kelvin
  satellite?: string | null;
  classification?: string | null;
  classification_method?: string | null;
  confidence?: number | string | null;
  risk_score?: number | null;
  priority?: PriorityType | string | null;
  is_persistent?: boolean | null;
  historical_detection_count?: number | null;
  land_cover?: string | null;
  nearest_facility?: NearestFacility | null;
  evidence?: string[] | null;
}

export interface Facility {
  id: string;
  name: string;
  facility_type: string;
  latitude: number;
  longitude: number;
  address?: string;
  sector?: string;
}

export interface SystemStatistics {
  active_events: number | null;
  industrial_events: number | null;
  persistent_sources: number | null;
  natural_events: number | null;
  agricultural_events: number | null;
  high_priority_events: number | null;
  last_updated?: string | null;
}

export interface FilterState {
  classification: string;
  priority: string;
  persistence: "all" | "persistent" | "non-persistent";
  minConfidence: number | null;
  showFacilities: boolean;
}

export type TelemetryDataStatus = "live" | "cached" | "mock_fallback" | "error";
