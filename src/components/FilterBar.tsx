import React from "react";
import type { FilterState } from "../types";
import { Filter, RotateCcw, Building2 } from "lucide-react";

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  totalEvents: number;
  filteredEventsCount: number;
}

const CLASSIFICATION_OPTIONS = [
  { value: "all", label: "All Classifications" },
  { value: "Probable Industrial Fire", label: "🔴 Industrial Fire" },
  { value: "Probable Persistent Industrial Thermal Source", label: "🟠 Persistent Industrial Source" },
  { value: "Probable Agricultural Burning", label: "🟢 Agricultural Burning" },
  { value: "Probable Natural / Forest Fire", label: "🔵 Natural / Forest Fire" },
  { value: "Other / Unknown", label: "⚪ Other / Unknown" },
  { value: "Unclassified Thermal Anomaly", label: "⚪ Unclassified Thermal Anomaly" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priorities" },
  { value: "HIGH", label: "High Priority" },
  { value: "MEDIUM", label: "Medium Priority" },
  { value: "LOW", label: "Low Priority" },
];

const PERSISTENCE_OPTIONS = [
  { value: "all", label: "All Sources" },
  { value: "persistent", label: "Persistent Only" },
  { value: "non-persistent", label: "Non-Persistent Only" },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  totalEvents,
  filteredEventsCount,
}) => {
  const handleReset = () => {
    onFilterChange({
      classification: "all",
      priority: "all",
      persistence: "all",
      minConfidence: null,
      showFacilities: true,
    });
  };

  const isFiltered =
    filters.classification !== "all" ||
    filters.priority !== "all" ||
    filters.persistence !== "all" ||
    filters.minConfidence !== null ||
    !filters.showFacilities;

  return (
    <div className="filter-bar-floating">
      <div className="filter-bar-header">
        <div className="filter-title">
          <Filter size={14} />
          <span>Filters</span>
        </div>
        <div className="filter-count">
          Showing <strong>{filteredEventsCount}</strong> of {totalEvents}
        </div>
      </div>

      <div className="filter-controls-grid">
        {/* Classification Filter */}
        <div className="filter-item">
          <label htmlFor="filter-classification">Classification</label>
          <select
            id="filter-classification"
            className="filter-select"
            value={filters.classification}
            onChange={(e) =>
              onFilterChange({ ...filters, classification: e.target.value })
            }
          >
            {CLASSIFICATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="filter-item">
          <label htmlFor="filter-priority">Priority</label>
          <select
            id="filter-priority"
            className="filter-select"
            value={filters.priority}
            onChange={(e) =>
              onFilterChange({ ...filters, priority: e.target.value })
            }
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Persistence Filter */}
        <div className="filter-item">
          <label htmlFor="filter-persistence">Persistence</label>
          <select
            id="filter-persistence"
            className="filter-select"
            value={filters.persistence}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                persistence: e.target.value as "all" | "persistent" | "non-persistent",
              })
            }
          >
            {PERSISTENCE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Confidence Threshold */}
        <div className="filter-item">
          <label htmlFor="filter-confidence">
            Min Confidence:{" "}
            <strong>{filters.minConfidence ? `${filters.minConfidence}%` : "Any"}</strong>
          </label>
          <input
            id="filter-confidence"
            type="range"
            min="0"
            max="100"
            step="10"
            className="filter-range"
            value={filters.minConfidence ?? 0}
            onChange={(e) => {
              const val = Number(e.target.value);
              onFilterChange({
                ...filters,
                minConfidence: val > 0 ? val : null,
              });
            }}
          />
        </div>

        {/* Facilities Toggle & Reset */}
        <div className="filter-item filter-actions">
          <button
            type="button"
            className={`toggle-facilities-btn ${filters.showFacilities ? "active" : ""}`}
            onClick={() =>
              onFilterChange({
                ...filters,
                showFacilities: !filters.showFacilities,
              })
            }
            title="Toggle industrial facility markers"
          >
            <Building2 size={13} />
            <span>Facilities</span>
          </button>

          {isFiltered && (
            <button
              type="button"
              className="reset-filter-btn"
              onClick={handleReset}
              title="Reset all filters"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
