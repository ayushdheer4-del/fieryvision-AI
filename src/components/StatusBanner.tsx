import React from "react";
import type { TelemetryDataStatus } from "../types";
import { AlertCircle, AlertTriangle, Info, X } from "lucide-react";

interface StatusBannerProps {
  apiStatus: TelemetryDataStatus;
  errorMessage: string | null;
  onDismiss?: () => void;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  apiStatus,
  errorMessage,
  onDismiss,
}) => {
  if (apiStatus === "live") return null;

  const isCached = apiStatus === "cached";
  const isMock = apiStatus === "mock_fallback";

  const getStyleClass = () => {
    if (isCached) return "notice-info";
    if (isMock) return "notice-warning";
    return "notice-error";
  };

  return (
    <div className={`system-notice-banner ${getStyleClass()}`} role="alert">
      <div className="notice-icon-wrapper">
        {isCached ? (
          <Info size={16} />
        ) : isMock ? (
          <AlertTriangle size={16} />
        ) : (
          <AlertCircle size={16} />
        )}
      </div>

      <div className="notice-text-content">
        <span className="notice-title">
          {isCached
            ? "Displaying Cached Telemetry"
            : isMock
            ? "Development Fallback Mode (API Offline)"
            : "Backend Service Unavailable"}
        </span>
        <span className="notice-desc">
          {isCached
            ? errorMessage || "Backend currently unreachable. Displaying cached observation data."
            : isMock
            ? `Backend API unreachable (${errorMessage || "http://localhost:8000/api"}). Showing mock demonstration data. Telemetry is NOT live.`
            : errorMessage || "Unable to retrieve data from thermal monitoring service."}
        </span>
      </div>

      {onDismiss && (
        <button
          className="notice-dismiss-btn"
          onClick={onDismiss}
          aria-label="Dismiss notice"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
