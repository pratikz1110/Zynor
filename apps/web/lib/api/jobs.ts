import api from "./client";

export type Job = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  scheduled_start_at: string | null;
  scheduled_end_at: string | null;
  customer_id: number;
  technician_id: string | null; // UUID or null
  created_by_user_id: number | null;
  updated_by_user_id: number | null;
  created_at: string;
  updated_at: string;
};

export type JobCreate = {
  title: string;
  description?: string | null;
  status?: string; // default "NEW" on the backend
  scheduled_start_at?: string | null;
  scheduled_end_at?: string | null;
  customer_id: number;
  technician_id?: string | null;
};

export type JobUpdate = {
  title?: string;
  description?: string | null;
  status?: string;
  scheduled_start_at?: string | null;
  scheduled_end_at?: string | null;
  customer_id?: number;
  technician_id?: string | null;
};

export async function fetchJobs(): Promise<Job[]> {
  // Try both possible paths: /jobs and /api/jobs
  let data: any;
  try {
    const res = await api.get("/jobs");
    data = res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      const res = await api.get("/api/jobs");
      data = res.data;
    } else {
      throw err;
    }
  }

  // Normalise the shape:
  // - if backend returns a plain array -> use it
  // - if backend returns { items: [...] } or { results: [...] } -> use that
  if (Array.isArray(data)) {
    return data as Job[];
  }
  if (Array.isArray((data as any).items)) {
    return (data as any).items as Job[];
  }
  if (Array.isArray((data as any).results)) {
    return (data as any).results as Job[];
  }

  // Fallback: no jobs
  return [];
}

export async function createJob(payload: JobCreate): Promise<Job> {
  let data: any;

  try {
    const res = await api.post("/jobs", payload);
    data = res.data;
  } catch (err: any) {
    // If the plain route is not found, try with /api prefix
    if (err?.response?.status === 404) {
      const res = await api.post("/api/jobs", payload);
      data = res.data;
    } else {
      throw err;
    }
  }

  // If backend wraps it like { item: {...} }, unwrap common shape
  if (data && typeof data === "object" && (data as any).item) {
    return (data as any).item as Job;
  }

  return data as Job;
}

export async function updateJob(
  id: number,
  payload: JobUpdate
): Promise<Job> {
  let data: any;

  try {
    const res = await api.put(`/jobs/${id}`, payload);
    data = res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      const res = await api.put(`/api/jobs/${id}`, payload);
      data = res.data;
    } else {
      throw err;
    }
  }

  if (data && typeof data === "object" && (data as any).item) {
    return (data as any).item as Job;
  }

  return data as Job;
}

export async function getJob(id: number): Promise<Job> {
  let data: any;

  try {
    const res = await api.get(`/jobs/${id}`);
    data = res.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      // Try with /api prefix if plain path is not found
      const res = await api.get(`/api/jobs/${id}`);
      data = res.data;
    } else {
      throw err;
    }
  }

  // If backend wraps in { item: {...} } or similar, unwrap common shapes
  if (data && typeof data === "object") {
    if ((data as any).item && typeof (data as any).item === "object") {
      return (data as any).item as Job;
    }
  }

  return data as Job;
}

export async function deleteJob(id: number): Promise<void> {
  try {
    await api.delete(`/jobs/${id}`);
  } catch (err: any) {
    if (err?.response?.status === 404) {
      // Try with /api prefix if the plain route is not found
      await api.delete(`/api/jobs/${id}`);
    } else {
      throw err;
    }
  }
}

