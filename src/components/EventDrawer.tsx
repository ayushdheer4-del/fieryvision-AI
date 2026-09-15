import React from "react";
import type { ThermalEvent } from "../types";
import { getClassificationInfo, getPriorityBadge } from "../utils/colors";
import {
  X,
  Clock,
  Building,
  Layers,
  Sparkles,
  History,
  ShieldAlert,
  MapPin,
} from "lucide-react";

interface EventDrawerProps {
  event: ThermalEvent | null;
  onClose: () => void;
}

export const EventDrawer: React.FC<EventDrawerProps> = ({ event, onClose }) => {
  if (!event) return null;

  // Requirement 2: When no classification exists, show "Unclassified Thermal Anomaly"
  const hasClassification = Boolean(
    event.classification &&
    event.classification.trim() !== "" &&
    event.classification !== "Unclassified"
  );
  const displayClassification = hasClassification
    ? event.classification!
    : "Unclassified Thermal Anomaly";

  const classInfo = getClassificationInfo(displayClassification);
  const priorityInfo = getPriorityBadge(event.priority);

  // Requirement 2: When ML is unavailable, show "Evidence-Based Assessment"
  const classificationMethod =
    event.classification_method && event.classification_method.trim() !== ""
      ? event.classification_method
      : "Evidence-Based Assessment";

  // Detection time
  const formattedTime = (() => {
    if (!event.detection_time) return "Not available";
    try {
      const d = new Date(event.detection_time);
      if (isNaN(d.getTime())) return event.detection_time;
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (${event.detection_time})`;
    } catch {
      return event.detection_time;
    }
  })();

  const formatDistance = (nearest?: { distance_meters?: number; distance_km?: number } | null) => {
    if (!nearest) return null;
    if (nearest.distance_meters !== undefined && nearest.distance_meters !== null) {
      return `${nearest.distance_meters} m`;
    }
    if (nearest.distance_km !== undefined && nearest.distance_km !== null) {
      return `${(nearest.distance_km * 1000).toFixed(0)} m (${nearest.distance_km} km)`;
    }
    return null;
  };

  return (
    <aside className="event-drawer" aria-label="Thermal Event Details Drawer">
      {/* Drawer Header */}
      <div className="drawer-header">
        <div className="drawer-title-row">
          <div className="drawer-event-id-group">
            <span className="drawer-kicker">THERMAL ANOMALY</span>
            <h2 className="drawer-event-id">{event.id}</h2>
          </div>
          <button
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close drawer"
            title="Close drawer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Classification Badge Banner */}
        <div
          className="drawer-classification-banner"
          style={{
            borderColor: classInfo.color,
            backgroundColor: classInfo.bg,
          }}
        >
          <div className="drawer-classification-dot" style={{ backgroundColor: classInfo.color }} />
          <div className="drawer-classification-text">
            <span className="drawer-classification-name">{displayClassification}</span>
            <span className="drawer-classification-method">
              Method: <strong>{classificationMethod}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Drawer Scrollable Body */}
      <div className="drawer-body">
        {/* Telemetry & Risk Metrics */}
        <div className="drawer-section">
          <h3 className="drawer-section-title">Telemetry & Risk Metrics</h3>
          <div className="metrics-grid">
            <div className="metric-box">
              <span className="metric-label">Priority</span>
              <span
                className="priority-pill"
                style={{
                  color: priorityInfo.color,
                  backgroundColor: priorityInfo.bg,
                  borderColor: priorityInfo.color,
                }}
              >
                {priorityInfo.label}
              </span>
            </div>

            <div className="metric-box">
              <span className="metric-label">Risk Score</span>
              <span className="metric-value">
                {event.risk_score !== null && event.risk_score !== undefined
                  ? `${event.risk_score}/100`
                  : "Not available"}
              </span>
            </div>

            <div className="metric-box">
              <span className="metric-label">Confidence</span>
              <span className="metric-value">
                {event.confidence !== null && event.confidence !== undefined
                  ? `${event.confidence}%`
                  : "Not available"}
              </span>
            </div>

            <div className="metric-box">
              <span className="metric-label">FRP (Power)</span>
              <span className="metric-value highlight-frp">
                {event.frp !== null && event.frp !== undefined
                  ? `${event.frp} MW`
                  : "Not available"}
              </span>
            </div>

            <div className="metric-box">
              <span className="metric-label">Brightness</span>
              <span className="metric-value">
                {event.brightness !== null && event.brightness !== undefined
                  ? `${event.brightness} K`
                  : "Not available"}
              </span>
            </div>

            <div className="metric-box">
              <span className="metric-label">Satellite</span>
              <span className="metric-value text-compact">
                {event.satellite || "Not available"}
              </span>
            </div>
          </div>
        </div>

        {/* Detection Time & Spatial Details */}
        <div className="drawer-section">
          <h3 className="drawer-section-title">Detection & Context</h3>
          <div className="detail-list">
            <div className="detail-row">
              <div className="detail-key">
                <Clock size={14} className="detail-icon" />
                <span>Detection Time</span>
              </div>
              <div className="detail-val">
                <span>{formattedTime}</span>
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-key">
                <MapPin size={14} className="detail-icon" />
                <span>Coordinates</span>
              </div>
              <div className="detail-val code-val">
                {typeof event.latitude === "number" && typeof event.longitude === "number"
                  ? `${event.latitude.toFixed(5)}, ${event.longitude.toFixed(5)}`
                  : "Not available"}
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-key">
                <Layers size={14} className="detail-icon" />
                <span>Land Cover</span>
              </div>
              <div className="detail-val">
                {event.land_cover || "Not available"}
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-key">
                <History size={14} className="detail-icon" />
                <span>Persistence</span>
              </div>
              <div className="detail-val">
                {event.is_persistent === true ? (
                  <span className="badge-persistent">Persistent Source</span>
                ) : event.is_persistent === false ? (
                  <span className="badge-transient">Transient Anomaly</span>
                ) : (
                  "Not available"
                )}
              </div>
            </div>

            <div className="detail-row">
              <div className="detail-key">
                <Sparkles size={14} className="detail-icon" />
                <span>Historical Detections</span>
              </div>
              <div className="detail-val">
                {event.historical_detection_count !== null &&
                event.historical_detection_count !== undefined
                  ? `${event.historical_detection_count} observations`
                  : "Not available"}
              </div>
            </div>
          </div>
        </div>

        {/* Industrial Facility Association */}
        <div className="drawer-section">
          <h3 className="drawer-section-title">Nearest Facility</h3>
          {event.nearest_facility ? (
            <div className="facility-card">
              <div className="facility-card-header">
                <Building size={16} className="facility-icon" />
                <div>
                  <h4 className="facility-name">
                    {event.nearest_facility.name || "Facility"}
                  </h4>
                  <p className="facility-type">
                    Type: <strong>{event.nearest_facility.facility_type || "Industrial"}</strong>
                  </p>
                </div>
              </div>
              <div className="facility-distance-row">
                <span>Distance:</span>
                <strong className="proximity-val">
                  {formatDistance(event.nearest_facility) || "In direct proximity"}
                </strong>
              </div>
            </div>
          ) : (
            <div className="empty-field-notice">
              <p>No registered facility within direct radius.</p>
            </div>
          )}
        </div>

        {/* Task 6 / Requirement 2: Evidence Section */}
        <div className="drawer-section evidence-section">
          <div className="evidence-header">
            <ShieldAlert size={16} className="evidence-icon" />
            <h3 className="drawer-section-title no-margin">Why was this event flagged?</h3>
          </div>

          {event.evidence && event.evidence.length > 0 ? (
            <ul className="evidence-list">
              {event.evidence.map((bullet, idx) => (
                <li key={idx} className="evidence-item">
                  <span className="evidence-bullet-point" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-field-notice">
              <p>No backend evidence annotations provided.</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
