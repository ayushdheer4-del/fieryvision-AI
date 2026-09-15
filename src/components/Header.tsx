import React from "react";
import type { SystemStatistics, TelemetryDataStatus } from "../types";
import { Flame, Activity, Factory, Layers, Trees, Wheat, AlertTriangle, RefreshCw } from "lucide-react";

interface HeaderProps {
  statistics: SystemStatistics | null;
  loadingStats: boolean;
  apiStatus: TelemetryDataStatus;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  statistics,
  loadingStats,
  apiStatus,
  onRefresh,
  isRefreshing,
}) => {
  const formatStat = (val: number | null | undefined): string => {
    if (loadingStats) return "...";
    if (val === null || val === undefined) return "--";
    return val.toLocaleString();
  };

  const getStatusDetails = () => {
    switch (apiStatus) {
      case "live":
        return {
          label: "API Live",
          className: "status-live",
          title: "Connected to live FastAPI backend service",
        };
      case "cached":
        return {
          label: "Cached Data",
          className: "status-cached",
          title: "Backend currently unreachable; displaying last-cached observation data",
        };
      case "mock_fallback":
        return {
          label: "Dev Fallback (Offline)",
          className: "status-mock",
          title: "Live backend unreachable; displaying local development fallback dataset",
        };
      case "error":
      default:
        return {
          label: "API Error",
          className: "status-error",
          title: "Failed to connect to thermal monitoring backend",
        };
    }
  };

  const statusInfo = getStatusDetails();

  return (
    <header className="fiery-header">
      <div className="header-brand">
        <div className="brand-icon-wrapper">
          <Flame className="brand-flame-icon" size={22} />
        </div>
        <div>
          <div className="brand-title-row">
            <h1 className="brand-title">FieryVision AI</h1>
            <span className="brand-badge">PAGE 1</span>
          </div>
          <p className="brand-subtitle">Giaspura Thermal Monitoring Map</p>
        </div>
      </div>

      {/* Top-Level Compact Statistics Area */}
      <div className="stats-container">
        <div className="stat-card" title="Total Active Thermal Events">
          <div className="stat-icon stat-icon-flame">
            <Activity size={14} />
          </div>
          <div className="stat-meta">
            <span className="stat-label">Active Events</span>
            <span className="stat-value">{formatStat(statistics?.active_events)}</span>
          </div>
        </div>

        <div className="stat-card" title="Industrial Thermal Events">
          <div className="stat-icon stat-icon-industrial">
            <Factory size={14} />
          </div>
          <div className="stat-meta">
            <span className="stat-label">Industrial Events</span>
            <span className="stat-value">{formatStat(statistics?.industrial_events)}</span>
          </div>
        </div>

        <div className="stat-card" title="Persistent Thermal Sources">
          <div className="stat-icon stat-icon-persistent">
            <Layers size={14} />
          </div>
          <div className="stat-meta">
            <span className="stat-label">Persistent Sources</span>
            <span className="stat-value">{formatStat(statistics?.persistent_sources)}</span>
          </div>
        </div>

        <div className="stat-card" title="Natural / Forest Fires">
          <div className="stat-icon stat-icon-natural">
            <Trees size={14} />
          </div>
          <div className="stat-meta">
            <span className="stat-label">Natural Events</span>
            <span className="stat-value">{formatStat(statistics?.natural_events)}</span>
          </div>
        </div>

        <div className="stat-card" title="Agricultural Burning Events">
          <div className="stat-icon stat-icon-agricultural">
            <Wheat size={14} />
          </div>
          <div className="stat-meta">
            <span className="stat-label">Agricultural</span>
            <span className="stat-value">{formatStat(statistics?.agricultural_events)}</span>
          </div>
        </div>

        <div className="stat-card stat-card-high" title="High Priority Urgent Events">
          <div className="stat-icon stat-icon-alert">
            <AlertTriangle size={14} />
          </div>
          <div className="stat-meta">
            <span className="stat-label">High Priority</span>
            <span className="stat-value stat-value-high">
              {formatStat(statistics?.high_priority_events)}
            </span>
          </div>
        </div>
      </div>

      {/* Header Controls & Status */}
      <div className="header-controls">
        <div className={`status-pill ${statusInfo.className}`} title={statusInfo.title}>
          <span className="status-indicator-dot" />
          <span className="status-text">{statusInfo.label}</span>
        </div>

        <button
          className="refresh-btn"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh telemetry"
          aria-label="Refresh telemetry"
        >
          <RefreshCw size={14} className={isRefreshing ? "spin" : ""} />
        </button>
      </div>
    </header>
  );
};
