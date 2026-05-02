/** Roles returned by the API after login (TODO: map from /api/v1/me response) */
export type UserRole =
  | 'call_center'
  | 'dispatcher'
  | 'sales'
  | 'technician'
  | 'tech_lead'
  | 'parts'
  | 'finance'
  | 'manager'
  | 'admin';

/** Which app layout to render for a given role */
export type AppLayout = 'office' | 'tech' | 'parts' | 'finance' | 'manager' | 'admin';

export function getRoleLayout(role: UserRole): AppLayout {
  switch (role) {
    case 'call_center':
    case 'dispatcher':
    case 'sales':     return 'office';
    case 'technician':
    case 'tech_lead': return 'tech';
    case 'parts':     return 'parts';
    case 'finance':   return 'finance';
    case 'manager':   return 'manager';
    case 'admin':     return 'admin';
  }
}

export type JobStatus =
  | "scheduled"
  | "en_route"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "estimate";

/**
 * Granular workflow status tracked only for the technician.
 * Maps to a coarser JobStatus for the office view (see TECH_TO_SYSTEM_STATUS).
 */
export type TechWorkflowStatus =
  | "on_the_way"
  | "diagnostic"
  | "need_parts"
  | "parts_received"
  | "need_new_parts"
  | "parts_installed"
  | "estimate_follow_up"
  | "get_service_call_payment"
  | "get_full_payment"
  | "completed";

export type PaymentStatus = "unpaid" | "partial" | "paid";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes?: string;
  createdAt: string;
}

export interface Job {
  id: string;
  jobNumber: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  title: string;
  description: string;
  status: JobStatus;
  priority: "low" | "medium" | "high";
  scheduledDate: string;
  scheduledTime: string;
  scheduledEndTime: string;
  technicianId: string;
  technicianName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  distance?: string;
  latitude?: number;
  longitude?: number;
  estimatedDuration: number; // in minutes
  total: number;
  paid: number;
  balance: number;
  paymentStatus: PaymentStatus;
  invoiceNumber?: string;
  payments?: Payment[];
  items: JobItem[];
  tags: string[];
  techWorkflowStatus?: TechWorkflowStatus;
  attachments?: number;
  servicePlan?: string;
  notes?: string;
  photos?: string[];
  timeline: JobTimelineEvent[];
}

export interface JobItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  total: number;
  type: "service" | "part";
}

export interface JobTimelineEvent {
  id: string;
  status: JobStatus;
  timestamp: string;
  note?: string;
}

export interface Estimate {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  status: "draft" | "sent" | "approved" | "rejected";
  items: JobItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  createdAt: string;
  validUntil: string;
}

export interface Invoice {
  id: string;
  jobId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  amount: number;
  paid: number;
  balance: number;
  status: PaymentStatus;
  dueDate: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  jobId: string;
  invoiceId?: string;
  amount: number;
  method: "cash" | "check" | "card" | "other";
  transactionId?: string;
  timestamp: string;
  notes?: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface MessageThread {
  id: string;
  title: string;
  phone?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  participants: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "dispatcher" | "technician";
  phone: string;
  avatar?: string;
}

/* ------------------------------------------------------------------ */
/*  Support / Helpdesk                                                  */
/* ------------------------------------------------------------------ */

export type SupportTicketStatus = "open" | "closed";

export interface SupportTicket {
  id: string;
  deptId: string;         // which department this belongs to
  jobId?: string;         // related job (optional)
  jobNumber?: string;
  clientName?: string;
  subject: string;        // initial message / subject
  status: SupportTicketStatus;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: "tech" | "dept";   // who sent it
  content: string;
  timestamp: string;
}
