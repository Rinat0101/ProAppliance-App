import { apiFetch } from '~/services/api';
import type { Client } from '~/types';

/* ------------------------------------------------------------------ */
/*  Odoo response shape                                                 */
/* ------------------------------------------------------------------ */

interface OdooContact {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  street?: string | null;
  street2?: string | null;
  city?: string | null;
  zip?: string | null;
  country_id?: { id: number; name: string } | null;
  is_company?: boolean;
  comment?: string | null;
  write_date?: string | null;
  create_date?: string | null;
}

interface ContactsResponse {
  data: OdooContact[];
  total?: number;
  page?: number;
  limit?: number;
}

/* ------------------------------------------------------------------ */
/*  Mapper: Odoo contact → app Client                                  */
/* ------------------------------------------------------------------ */

function mapContact(c: OdooContact): Client {
  const phone = c.phone ?? c.mobile ?? '';
  return {
    id: String(c.id),
    name: c.name || phone || `Contact #${c.id}`,
    email: c.email ?? '',
    phone: c.phone ?? c.mobile ?? '',
    address: c.street ?? '',
    city: c.city ?? '',
    state: '',
    zip: c.zip ?? '',
    notes: c.comment ?? undefined,
    createdAt: c.create_date ?? new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/*  Public API                                                          */
/* ------------------------------------------------------------------ */

export async function fetchContacts(
  page = 1,
  limit = 20,
  search?: string
): Promise<{ clients: Client[]; total: number }> {
  const params: Record<string, string | number> = { page, limit };
  if (search) params.search = search;

  const res = await apiFetch<ContactsResponse>('/api/v1/contacts', { params });

  return {
    clients: res.data.map(mapContact),
    total: res.total ?? res.data.length,
  };
}

export async function fetchContact(id: string): Promise<Client> {
  const res = await apiFetch<OdooContact>(`/api/v1/contacts/${id}`);
  return mapContact(res);
}
