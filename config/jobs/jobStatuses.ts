// src/config/jobs/jobStatuses.ts

export type JobStatusGroupKey =
  | "inProgress"
  | "pending"
  | "donePendingApproval"
  | "standalone";

export type JobStatusGroups = {
  inProgress: { label: string; color: string; statuses: string[] };
  pending: { label: string; color: string; statuses: string[] };
  donePendingApproval: { label: string; color: string; statuses: string[] };
  standalone: { status: string; color: string }[];
};

export const STATUS_GROUPS: JobStatusGroups = {
  inProgress: {
    label: "In Progress",
    color: "hsl(330, 70%, 55%)", // pink
    statuses: ["On The Way", "Diagnostic"],
  },
  pending: {
    label: "Pending",
    color: "hsl(45, 90%, 45%)", // yellow/orange
    statuses: [
      "Need Parts",
      "Parts Search",
      "Parts Ordered",
      "Parts Shipped",
      "Parts Delivered",
      "Parts Received",
      "Need Schedule Follow Up",
      "Need Return Parts",
      "Need New Parts",
      "Follow Up Scheduled",
      "Parts Installed",
    ],
  },
  donePendingApproval: {
    label: "Done Pending Approval",
    color: "hsl(25, 85%, 50%)", // orange
    statuses: [
      "Ready To Check",
      "Estimate Follow Up",
      "Get Service Call Payment",
      "Get Deposit",
      "Get Full Payment",
      "Decline To Pay Service Call",
      "Estimate Follow Up VM",
    ],
  },
  standalone: [
    { status: "Submitted", color: "hsl(210, 80%, 55%)" }, // blue
    { status: "Cancelled", color: "hsl(0, 70%, 50%)" }, // red
    { status: "Done", color: "hsl(140, 60%, 45%)" }, // green
  ],
};

/** Returns the color for any status in STATUS_GROUPS */
export function getStatusColor(status: string): string {
  const standalone = STATUS_GROUPS.standalone.find((s) => s.status === status);
  if (standalone) return standalone.color;

  if (STATUS_GROUPS.inProgress.statuses.includes(status))
    return STATUS_GROUPS.inProgress.color;

  if (STATUS_GROUPS.pending.statuses.includes(status))
    return STATUS_GROUPS.pending.color;

  if (STATUS_GROUPS.donePendingApproval.statuses.includes(status))
    return STATUS_GROUPS.donePendingApproval.color;

  // fallback (blue-ish)
  return "hsl(210, 80%, 55%)";
}

export function getAllStatusesInOrder(): Array<
  { type: "standalone"; status: string; color: string } | { type: "groupHeader"; label: string; color: string } | { type: "groupItem"; status: string; color: string }
> {
  const out: Array<any> = [];

  // Standalone: Submitted, Cancelled, Done
  for (const s of STATUS_GROUPS.standalone) {
    out.push({ type: "standalone", status: s.status, color: s.color });
  }

  // In Progress
  out.push({
    type: "groupHeader",
    label: STATUS_GROUPS.inProgress.label,
    color: STATUS_GROUPS.inProgress.color,
  });
  for (const st of STATUS_GROUPS.inProgress.statuses) {
    out.push({ type: "groupItem", status: st, color: STATUS_GROUPS.inProgress.color });
  }

  // Pending
  out.push({
    type: "groupHeader",
    label: STATUS_GROUPS.pending.label,
    color: STATUS_GROUPS.pending.color,
  });
  for (const st of STATUS_GROUPS.pending.statuses) {
    out.push({ type: "groupItem", status: st, color: STATUS_GROUPS.pending.color });
  }

  // Done Pending Approval
  out.push({
    type: "groupHeader",
    label: STATUS_GROUPS.donePendingApproval.label,
    color: STATUS_GROUPS.donePendingApproval.color,
  });
  for (const st of STATUS_GROUPS.donePendingApproval.statuses) {
    out.push({ type: "groupItem", status: st, color: STATUS_GROUPS.donePendingApproval.color });
  }

  return out;
}