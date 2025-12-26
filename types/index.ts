export type JobStatus = 
  | "scheduled" 
  | "en_route" 
  | "in_progress" 
  | "completed" 
  | "cancelled"
  | "estimate";

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
  estimatedDuration: number; // in minutes
  total: number;
  paid: number;
  balance: number;
  paymentStatus: PaymentStatus;
  invoiceNumber?: string;
  payments?: Payment[];
  items: JobItem[];
  tags: string[];
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
