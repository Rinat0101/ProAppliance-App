export type JobClient = {
  id: string;
  firstName?: string;
  lastName?: string;
  name: string;          // full display name
  company?: string;
  email?: string;
  phone: string;
  phoneExt?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  distanceMiles?: number;
  jobsCount?: number;
  invoicesCount?: number;
  leadsCount?: number;
  estimatesCount?: number;
  notesCount?: number;
  totalRevenue?: number;
  totalDue?: number;
};
