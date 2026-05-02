import { LightColors, DarkColors } from "~/styles";

export type JobTagCategory = "jobType" | "appliance" | "special";

export type JobTagConfig = {
  label: string;
  category: JobTagCategory;
  light: {
    bg: string;
    text: string;
  };
  dark: {
    bg: string;
    text: string;
  };
};

export const JOB_TAGS: Record<string, JobTagConfig> = {
  // ---------- JOB TYPES ----------
  Maintenance: {
    label: "Maintenance",
    category: "jobType",
    light: {
      bg: "#E8F0FE",
      text: "#1A73E8",
    },
    dark: {
      bg: "#1A2A4A",
      text: "#8AB4F8",
    },
  },

  Estimate: {
    label: "Estimate",
    category: "jobType",
    light: {
      bg: "#FFF4E5",
      text: "#F57C00",
    },
    dark: {
      bg: "#3A2A14",
      text: "#FFB74D",
    },
  },

  Installation: {
    label: "Installation",
    category: "jobType",
    light: {
      bg: "#E8F5E9",
      text: "#2E7D32",
    },
    dark: {
      bg: "#1F3B28",
      text: "#81C784",
    },
  },

  "Follow Up": {
    label: "Follow Up",
    category: "jobType",
    light: {
      bg: "#F3E5F5",
      text: "#7B1FA2",
    },
    dark: {
      bg: "#3B1E4A",
      text: "#CE93D8",
    },
  },

  "Service Call": {
    label: "Service Call",
    category: "jobType",
    light: {
      bg: "#E1F5FE",
      text: "#0277BD",
    },
    dark: {
      bg: "#0D2A3A",
      text: "#81D4FA",
    },
  },

  // ---------- APPLIANCES ----------
  Freezer: applianceTag("Freezer"),
  Dishwasher: applianceTag("Dishwasher"),
  Washer: applianceTag("Washer"),
  Dryer: applianceTag("Dryer"),
  Oven: applianceTag("Oven"),
  Microwave: applianceTag("Microwave"),
  Refrigerator: applianceTag("Refrigerator"),
  Range: applianceTag("Range"),
  "Garbage Disposal": applianceTag("Garbage Disposal"),

  // ---------- SPECIAL ----------
  "High-End": {
    label: "High-End",
    category: "special",
    light: {
      bg: "#FFF3CD",
      text: "#856404",
    },
    dark: {
      bg: "#3A2F14",
      text: "#FFE082",
    },
  },

  Urgent: {
    label: "Urgent",
    category: "special",
    light: {
      bg: "#FDECEA",
      text: "#D32F2F",
    },
    dark: {
      bg: "#3A1E1E",
      text: "#EF9A9A",
    },
  },
};

/* ---------- HELPERS ---------- */

function applianceTag(label: string): JobTagConfig {
  return {
    label,
    category: "appliance",
    light: {
      bg: "#ECEFF1",
      text: "#37474F",
    },
    dark: {
      bg: "#263238",
      text: "#CFD8DC",
    },
  };
}