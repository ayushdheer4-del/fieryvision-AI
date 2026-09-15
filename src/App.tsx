import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { ThermalEvent, Facility, SystemStatistics, FilterState, TelemetryDataStatus } from "./types";
import { api } from "./services/api";
import { Header } from "./components/Header";
import { FilterBar } from "./components/FilterBar";
import { Map } from "./components/Map";
import { EventDrawer } from "./components/EventDrawer";
import { StatusBanner } from "./components/StatusBanner";

export const App: React.FC = () => {
  const [events, setEvents] = useState<ThermalEvent[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [statistics, setStatistics] = useState<SystemStatistics | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ThermalEvent | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<TelemetryDataStatus>("live");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);

  const [filters, setFilters] = useState<FilterState>({
    classification: "all",
    priority: "all",
    persistence: "all",
    minConfidence: null,
    showFacilities: true,
  });

  // Fetch telemetry data from backend or cache/fallback
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [eventsRes, facilitiesRes, statsRes] = await Promise.all([
        api.getActiveEvents(),
        api.getFacilities(),
        api.getStatistics(),
      ]);

      // Determine overall status across requests: live > cached > mock_fallback > error
      if (eventsRes.status === "live" && facilitiesRes.status === "live") {
        setApiStatus("live");
        setErrorMessage(null);
      } else if (eventsRes.status === "cached" || facilitiesRes.status === "cached") {
        setApiStatus("cached");
        setErrorMessage(eventsRes.error || "Displaying cached telemetry observations");
      } else if (eventsRes.status === "mock_fallback" || facilitiesRes.status === "mock_fallback") {
        setApiStatus("mock_fallback");
        setErrorMessage(eventsRes.error || "API offline; development fallback mode");
      } else {
        setApiStatus("error");
        setErrorMessage(eventsRes.error || "Failed to connect to backend telemetry service");
      }

      setEvents(eventsRes.data || []);
      setFacilities(facilitiesRes.data || []);

      // If backend statistics are available, prioritize them. Otherwise compute derived counters safely.
      if (statsRes.data) {
        setStatistics(statsRes.data);
      } else if (eventsRes.data) {
        const evts = eventsRes.data;
        setStatistics({
          active_events: evts.length,
          industrial_events: evts.filter((e) =>
            e.classification?.toLowerCase().includes("industrial")
          ).length,
          persistent_sources: evts.filter((e) => e.is_persistent === true).length,
          natural_events: evts.filter((e) =>
            e.classification?.toLowerCase().includes("natural") ||
            e.classification?.toLowerCase().includes("forest")
          ).length,
          agricultural_events: evts.filter((e) =>
            e.classification?.toLowerCase().includes("agri")
          ).length,
          high_priority_events: evts.filter(
            (e) => e.priority?.toUpperCase() === "HIGH"
          ).length,
        });
      }
    } catch (err: any) {
      setApiStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred while loading data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      if (!ignore) {
        await loadData();
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [loadData]);

  // Handle thermal event selection (and deep fetch if /api/events/{id} has additional telemetry)
  const handleSelectEvent = useCallback(async (event: ThermalEvent) => {
    setSelectedEvent(event);
    try {
      const detailRes = await api.getEventById(event.id);
      if (detailRes.data) {
        setSelectedEvent((prev) => (prev?.id === event.id ? { ...prev, ...detailRes.data } : prev));
      }
    } catch {
      // Keep existing payload on detail fetch error
    }
  }, []);

  // Efficient in-memory frontend filtering without redundant network requests
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Classification filter
      if (filters.classification !== "all") {
        if (filters.classification === "Unclassified Thermal Anomaly") {
          const isUnclass =
            !evt.classification ||
            evt.classification.trim() === "" ||
            evt.classification === "Unclassified" ||
            evt.classification === "Unclassified Thermal Anomaly";
          if (!isUnclass) return false;
        } else if (evt.classification !== filters.classification) {
          return false;
        }
      }

      // Priority filter
      if (filters.priority !== "all") {
        if (evt.priority?.toUpperCase() !== filters.priority.toUpperCase()) {
          return false;
        }
      }

      // Persistence filter
      if (filters.persistence === "persistent" && evt.is_persistent !== true) {
        return false;
      }
      if (filters.persistence === "non-persistent" && evt.is_persistent === true) {
        return false;
      }

      // Min Confidence threshold filter
      if (filters.minConfidence !== null) {
        const confNum =
          typeof evt.confidence === "number"
            ? evt.confidence
            : evt.confidence
            ? parseFloat(evt.confidence)
            : null;
        if (confNum === null || isNaN(confNum) || confNum < filters.minConfidence) {
          return false;
        }
      }

      return true;
    });
  }, [events, filters]);

  return (
    <div className="fiery-app-root">
      {/* Top compact statistics and branding bar */}
      <Header
        statistics={statistics}
        loadingStats={isLoading}
        apiStatus={apiStatus}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
      />

      {/* API Notice / Fallback Banner */}
      {!bannerDismissed && (
        <StatusBanner
          apiStatus={apiStatus}
          errorMessage={errorMessage}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}

      {/* Main Map Viewport (Map-First Experience) */}
      <main className="fiery-main-content">
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          totalEvents={events.length}
          filteredEventsCount={filteredEvents.length}
        />

        <Map
          events={filteredEvents}
          facilities={facilities}
          selectedEvent={selectedEvent}
          onSelectEvent={handleSelectEvent}
          showFacilities={filters.showFacilities}
          isLoading={isLoading}
          zeroEventsMessage={
            events.length === 0
              ? "No active thermal anomalies detected in the latest available observation window."
              : filteredEvents.length === 0
              ? "No thermal anomalies match current filter criteria."
              : undefined
          }
        />

        {/* Selected Event Details Drawer */}
        <EventDrawer
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      </main>
    </div>
  );
};

export default App;
