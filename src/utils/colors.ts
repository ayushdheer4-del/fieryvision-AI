import type { ClassificationType } from "../types";

export const CLASSIFICATION_COLORS: Record<ClassificationType, { bg: string; text: string; hex: string; dot: string }> = {
  "Probable Industrial Fire": {
    bg: "rgba(239, 68, 68, 0.15)",
    text: "#ef4444",
    hex: "#ef4444",
    dot: "🔴",
  },
  "Probable Persistent Industrial Thermal Source": {
    bg: "rgba(249, 115, 22, 0.15)",
    text: "#f97316",
    hex: "#f97316",
    dot: "🟠",
  },
  "Probable Agricultural Burning": {
    bg: "rgba(34, 197, 94, 0.15)",
    text: "#22c55e",
    hex: "#22c55e",
    dot: "🟢",
  },
  "Probable Natural / Forest Fire": {
    bg: "rgba(59, 130, 246, 0.15)",
    text: "#3b82f6",
    hex: "#3b82f6",
    dot: "🔵",
  },
  "Other / Unknown": {
    bg: "rgba(148, 163, 184, 0.15)",
    text: "#94a3b8",
    hex: "#94a3b8",
    dot: "⚪",
  },
  "Unclassified Thermal Anomaly": {
    bg: "rgba(100, 116, 139, 0.15)",
    text: "#94a3b8",
    hex: "#64748b",
    dot: "⚪",
  },
};

export function getClassificationInfo(classification?: string | null): {
  label: ClassificationType;
  color: string;
  dot: string;
  bg: string;
} {
  if (!classification || classification.trim() === "" || classification === "Unclassified") {
    const info = CLASSIFICATION_COLORS["Unclassified Thermal Anomaly"];
    return {
      label: "Unclassified Thermal Anomaly",
      color: info.hex,
      dot: info.dot,
      bg: info.bg,
    };
  }

  const match = Object.keys(CLASSIFICATION_COLORS).find(
    (key) => key.toLowerCase() === classification.toLowerCase()
  ) as ClassificationType | undefined;

  if (match) {
    const info = CLASSIFICATION_COLORS[match];
    return {
      label: match,
      color: info.hex,
      dot: info.dot,
      bg: info.bg,
    };
  }

  const fallback = CLASSIFICATION_COLORS["Other / Unknown"];
  return {
    label: "Other / Unknown",
    color: fallback.hex,
    dot: fallback.dot,
    bg: fallback.bg,
  };
}

export function getPriorityBadge(priority?: string | null): {
  label: string;
  color: string;
  bg: string;
} {
  switch (priority?.toUpperCase()) {
    case "HIGH":
      return { label: "HIGH", color: "#ef4444", bg: "rgba(239, 68, 68, 0.2)" };
    case "MEDIUM":
      return { label: "MEDIUM", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.2)" };
    case "LOW":
      return { label: "LOW", color: "#10b981", bg: "rgba(16, 185, 129, 0.2)" };
    default:
      return { label: priority || "UNSPECIFIED", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.2)" };
  }
}
