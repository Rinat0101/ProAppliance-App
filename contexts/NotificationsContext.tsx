/**
 * Notifications context — job change alerts for the technician.
 * TODO: replace mock data with real-time updates from Odoo bus / push notifications.
 */
import React, { createContext, useCallback, useContext, useState } from "react";

export type NotifType =
  | "job_assigned"
  | "job_rescheduled"
  | "job_cancelled"
  | "job_updated"
  | "job_note";

export interface Notification {
  id: string;
  type: NotifType;
  jobId: string;
  jobTitle: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

// TODO: replace with real notifications from GET /api/v1/notifications or websocket
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "job_assigned",
    jobId: "job-6",
    jobTitle: "Refrigerator Repair",
    message: "New job assigned to you for tomorrow at 9:00 AM",
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    read: false,
  },
  {
    id: "n2",
    type: "job_rescheduled",
    jobId: "job-1",
    jobTitle: "Freezer Repair",
    message: "Rescheduled from 14:00 to 16:00 today",
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    read: false,
  },
  {
    id: "n3",
    type: "job_cancelled",
    jobId: "job-7",
    jobTitle: "Dryer Vent Cleaning",
    message: "Job has been cancelled by the office",
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    read: false,
  },
  {
    id: "n4",
    type: "job_note",
    jobId: "job-2",
    jobTitle: "Dishwasher Installation",
    message: "Office added a note: customer has a dog, please ring doorbell",
    timestamp: new Date(Date.now() - 3 * 3600000).toISOString(),
    read: true,
  },
  {
    id: "n5",
    type: "job_updated",
    jobId: "job-8",
    jobTitle: "Range Installation",
    message: "Job details updated — appliance model changed to GE Profile",
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
    read: true,
  },
];

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAllRead, markRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationsProvider>");
  return ctx;
}
