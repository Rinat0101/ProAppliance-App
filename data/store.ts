/**
 * Central data store — single source of truth for all job/client data.
 *
 * Currently backed by mockData. When the Odoo API is ready, replace the
 * functions below with API calls (or React Query hooks) and the rest of
 * the app continues to work without changes.
 */

import { mockJobs, mockClients, mockUser, mockMessages, mockThreads, mockSupportTickets, mockSupportMessages } from './mockData';
import type { Job, Client, User, Message, MessageThread, SupportTicket, SupportMessage } from '~/types';

/* ------------------------------------------------------------------ */
/*  Jobs                                                                */
/* ------------------------------------------------------------------ */

export function getAllJobs(): Job[] {
  return mockJobs;
}

export function getJobById(id: string): Job | undefined {
  return mockJobs.find((j) => j.id === id);
}

export function getJobsByDate(dateKey: string): Job[] {
  return mockJobs
    .filter((j) => j.scheduledDate === dateKey)
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}

/* ------------------------------------------------------------------ */
/*  Clients                                                             */
/* ------------------------------------------------------------------ */

export function getAllClients(): Client[] {
  return mockClients;
}

export function getClientById(id: string): Client | undefined {
  return mockClients.find((c) => c.id === id);
}

/** Resolves the full Client record for a job using clientId. */
export function getClientForJob(job: Job): Client | undefined {
  return mockClients.find((c) => c.id === job.clientId);
}

/* ------------------------------------------------------------------ */
/*  Current user                                                        */
/* ------------------------------------------------------------------ */

export function getCurrentUser(): User {
  return mockUser;
}

/* ------------------------------------------------------------------ */
/*  Messages                                                            */
/* ------------------------------------------------------------------ */

export function getThreadById(id: string): MessageThread | undefined {
  return mockThreads.find((t) => t.id === id);
}

export function getMessagesForThread(threadId: string): Message[] {
  return mockMessages
    .filter((m) => m.threadId === threadId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/* ------------------------------------------------------------------ */
/*  Support / Helpdesk                                                  */
/* ------------------------------------------------------------------ */

export function getSupportTicketsByDept(deptId: string): SupportTicket[] {
  return mockSupportTickets
    .filter((t) => t.deptId === deptId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getSupportTicketById(id: string): SupportTicket | undefined {
  return mockSupportTickets.find((t) => t.id === id);
}

export function getSupportMessages(ticketId: string): SupportMessage[] {
  return mockSupportMessages
    .filter((m) => m.ticketId === ticketId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/* ------------------------------------------------------------------ */
/*  Tech dashboard                                                      */
/* ------------------------------------------------------------------ */

export type DashPeriod = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'custom';

export interface TechDashboardData {
  technicianName: string;
  /** Completed jobs in the selected period */
  jobsDone: number;
  /** Active (non-completed, non-cancelled) jobs in the period */
  jobsOpen: number;
  /** jobsDone / (jobsDone + jobsOpen) × 100 — 0 if no jobs */
  completionRate: number;
  /**
   * Technician's payout = sales × payoutRate.
   * TODO: fetch payoutRate from /api/v1/technician/me (e.g. { payout_rate: 0.4 })
   */
  toPayout: number;
  /** All jobs in the selected period, sorted by date + time */
  periodJobs: Job[];
}

/** Date range [from, to] as ISO date strings (inclusive) */
export function getPeriodRange(
  period: DashPeriod,
  customFrom?: string,
  customTo?: string
): { from: string; to: string } {
  const now = new Date();
  const todayKey = now.toISOString().split('T')[0];

  if (period === 'today') return { from: todayKey, to: todayKey };

  if (period === 'yesterday') {
    const y = new Date(now);
    y.setDate(now.getDate() - 1);
    const key = y.toISOString().split('T')[0];
    return { from: key, to: key };
  }

  if (period === 'this_week') {
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);
    return { from: monday.toISOString().split('T')[0], to: todayKey };
  }

  if (period === 'last_week') {
    const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() - dayOfWeek);
    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(thisMonday.getDate() - 7);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);
    return {
      from: lastMonday.toISOString().split('T')[0],
      to: lastSunday.toISOString().split('T')[0],
    };
  }

  if (period === 'this_month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    return { from, to: todayKey };
  }

  // custom
  return { from: customFrom ?? todayKey, to: customTo ?? todayKey };
}

/**
 * Computes tech dashboard KPIs for a given technician and period.
 * TODO: replace with GET /api/v1/technician/dashboard?technician_id={id}&period={period}
 *
 * Payout rate is currently hardcoded at 40%.
 * TODO: fetch from GET /api/v1/technician/me → { payout_rate: number }
 */
export function getTechDashboard(
  technicianId: string,
  period: DashPeriod = 'today',
  customFrom?: string,
  customTo?: string
): TechDashboardData {
  const PAYOUT_RATE = 0.4; // TODO: fetch from API

  const user = getCurrentUser();
  const { from, to } = getPeriodRange(period, customFrom, customTo);

  const periodJobs = mockJobs
    .filter(
      (j) =>
        j.technicianId === technicianId &&
        j.scheduledDate >= from &&
        j.scheduledDate <= to
    )
    .sort((a, b) =>
      a.scheduledDate !== b.scheduledDate
        ? a.scheduledDate.localeCompare(b.scheduledDate)
        : a.scheduledTime.localeCompare(b.scheduledTime)
    );

  const completedJobs = periodJobs.filter((j) => j.status === 'completed');
  const jobsDone = completedJobs.length;
  const jobsOpen = periodJobs.filter(
    (j) => j.status !== 'completed' && j.status !== 'cancelled'
  ).length;

  const sales = completedJobs.reduce((sum, j) => sum + j.total, 0);
  const toPayout = sales * PAYOUT_RATE;
  const completionRate = jobsDone + jobsOpen > 0
    ? Math.round((jobsDone / (jobsDone + jobsOpen)) * 100)
    : 0;

  return {
    technicianName: user.name,
    jobsDone,
    jobsOpen,
    completionRate,
    toPayout,
    periodJobs,
  };
}
