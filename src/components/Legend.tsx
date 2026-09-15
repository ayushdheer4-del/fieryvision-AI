import React, { useState } from "react";
import { CLASSIFICATION_COLORS } from "../utils/colors";
import { ChevronDown, ChevronUp, Layers } from "lucide-react";

export const Legend: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="map-legend-card">
      <div
        className="legend-header"
        onClick={() => setCollapsed(!collapsed)}
        role="button"
        tabIndex={0}
      >
        <div className="legend-title">
          <Layers size={13} />
          <span>Map Legend</span>
        </div>
        <button className="legend-collapse-toggle" aria-label="Toggle legend">
          {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {!collapsed && (
        <div className="legend-body">
          <div className="legend-section">
            <span className="legend-section-label">Thermal Classifications</span>
            <div className="legend-items-list">
              {Object.entries(CLASSIFICATION_COLORS).map(([key, item]) => (
                <div key={key} className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: item.hex }} />
                  <span className="legend-text">{key}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="legend-section">
            <span className="legend-section-label">Infrastructure & Bounds</span>
            <div className="legend-items-list">
              <div className="legend-item">
                <span className="legend-icon-marker">🏭</span>
                <span className="legend-text">Industrial Facilities</span>
              </div>
              <div className="legend-item">
                <span className="legend-boundary-line" />
                <span className="legend-text">Giaspura Study Boundary</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
