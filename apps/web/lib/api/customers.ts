import api from "./client";

export interface Customer {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface CustomerCreate {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface CustomerUpdate {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export async function fetchCustomers(): Promise<Customer[]> {
  // Try both possible paths: /customers and /api/customers
  let data: any;
  try {
    const res = await api.get("/customers");
    data = res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      const res = await api.get("/api/customers");
      data = res.data;
    } else {
      throw err;
    }
  }

  // Normalise the shape:
  // - if backend returns a plain array -> use it
  // - if backend returns { items: [...] } or { results: [...] } -> use that
  if (Array.isArray(data)) {
    return data as Customer[];
  }
  if (Array.isArray((data as any).items)) {
    return (data as any).items as Customer[];
  }
  if (Array.isArray((data as any).results)) {
    return (data as any).results as Customer[];
  }

  // Fallback: no customers
  return [];
}

export async function getCustomer(id: number): Promise<Customer | null> {
  let data: any;

  try {
    const res = await api.get(`/customers/${id}`);
    data = res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      // Try with /api prefix if plain path is not found
      const res = await api.get(`/api/customers/${id}`);
      data = res.data;
    } else {
      throw err;
    }
  }

  // If backend wraps in { item: {...} } or similar, unwrap common shapes
  if (data && typeof data === "object") {
    if ((data as any).item && typeof (data as any).item === "object") {
      return (data as any).item as Customer;
    }
  }

  return data as Customer | null;
}

export async function createCustomer(payload: CustomerCreate): Promise<Customer> {
  let data: any;

  try {
    const res = await api.post("/customers", payload);
    data = res.data;
  } catch (err: any) {
    // If the plain route is not found, try with /api prefix
    if (err?.response?.status === 404) {
      const res = await api.post("/api/customers", payload);
      data = res.data;
    } else {
      throw err;
    }
  }

  // If backend wraps it like { item: {...} }, unwrap common shape
  if (data && typeof data === "object" && (data as any).item) {
    return (data as any).item as Customer;
  }

  return data as Customer;
}

export async function updateCustomer(
  id: number,
  payload: CustomerUpdate
): Promise<Customer> {
  let data: any;

  try {
    const res = await api.put(`/customers/${id}`, payload);
    data = res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      const res = await api.put(`/api/customers/${id}`, payload);
      data = res.data;
    } else {
      throw err;
    }
  }

  if (data && typeof data === "object" && (data as any).item) {
    return (data as any).item as Customer;
  }

  return data as Customer;
}

export async function deleteCustomer(id: number): Promise<void> {
  try {
    await api.delete(`/customers/${id}`);
  } catch (err: any) {
    if (err?.response?.status === 404) {
      // Try with /api prefix if the plain route is not found
      await api.delete(`/api/customers/${id}`);
    } else {
      throw err;
    }
  }
}

