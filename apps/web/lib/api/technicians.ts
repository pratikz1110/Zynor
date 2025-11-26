import api from "./client";

export type Technician = {
  id: string | number;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  skills?: string[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};
export async function listTechnicians(params?: {
  q?: string;
  page?: number;
  page_size?: number;
}): Promise<Technician[]> {
  // Try both possible paths: /technicians and /api/technicians
  let data: any;
  try {
    const res = await api.get("/technicians", { params });
    data = res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      const res = await api.get("/api/technicians", { params });
      data = res.data;
    } else {
      throw err;
    }
  }

  // Normalise the shape:
  // - if backend returns a plain array -> use it
  // - if backend returns { items: [...] } or { results: [...] } -> use that
  if (Array.isArray(data)) {
    return data as Technician[];
  }
  if (Array.isArray((data as any).items)) {
    return (data as any).items as Technician[];
  }
  if (Array.isArray((data as any).results)) {
    return (data as any).results as Technician[];
  }

  // Fallback: no technicians
  return [];
}

export async function getTechnician(id: string | number): Promise<Technician | null> {
  let data: any;

  try {
    const res = await api.get(`/technicians/${id}`);
    data = res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      // Try with /api prefix if plain path is not found
      const res = await api.get(`/api/technicians/${id}`);
      data = res.data;
    } else {
      throw err;
    }
  }

  // If backend wraps in { item: {...} } or similar, unwrap common shapes
  if (data && typeof data === "object") {
    if ((data as any).item && typeof (data as any).item === "object") {
      return (data as any).item as Technician;
    }
  }

  return data as Technician | null;
}

export type CreateTechnicianInput = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  skills?: string[];   // optional list of skills
  is_active?: boolean; // default true if omitted
};

export type UpdateTechnicianInput = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  skills?: string[];
  is_active?: boolean;
};

export async function createTechnician(
  payload: CreateTechnicianInput
): Promise<Technician> {
  let data: any;

  try {
    const res = await api.post("/technicians", payload);
    data = res.data;
  } catch (err: any) {
    // If the plain route is not found, try with /api prefix
    if (err?.response?.status === 404) {
      const res = await api.post("/api/technicians", payload);
      data = res.data;
    } else {
      throw err;
    }
  }

  // If backend wraps it like { item: {...} }, unwrap common shape
  if (data && typeof data === "object" && (data as any).item) {
    return (data as any).item as Technician;
  }

  return data as Technician;
}

export async function updateTechnician(
  id: string | number,
  payload: UpdateTechnicianInput
): Promise<Technician> {
  let data: any;

  try {
    const res = await api.put(`/technicians/${id}`, payload);
    data = res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      const res = await api.put(`/api/technicians/${id}`, payload);
      data = res.data;
    } else {
      throw err;
    }
  }

  if (data && typeof data === "object" && (data as any).item) {
    return (data as any).item as Technician;
  }

  return data as Technician;
}

export async function deleteTechnician(id: string | number): Promise<void> {
  try {
    await api.delete(`/technicians/${id}`);
  } catch (err: any) {
    if (err?.response?.status === 404) {
      // Try with /api prefix if the plain route is not found
      await api.delete(`/api/technicians/${id}`);
    } else {
      throw err;
    }
  }
}

