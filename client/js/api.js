// ============================================================
// API Helper — wraps all calls to the Express backend
// ============================================================

async function apiFetch(path, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${CONFIG.API_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

var api = {
  // --- Specialties ---
  getSpecialties: (search = '') =>
    apiFetch(`/api/specialties${search ? `?search=${encodeURIComponent(search)}` : ''}`),

  createSpecialty: (body, token) =>
    apiFetch('/api/specialties', { method: 'POST', body: JSON.stringify(body) }, token),

  updateSpecialty: (id, body, token) =>
    apiFetch(`/api/specialties/${id}`, { method: 'PUT', body: JSON.stringify(body) }, token),

  deleteSpecialty: (id, token) =>
    apiFetch(`/api/specialties/${id}`, { method: 'DELETE' }, token),

  // --- Doctors ---
  getDoctors: ({ search = '', specialty_id = '', sort = '' } = {}) => {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (specialty_id) q.set('specialty_id', specialty_id);
    if (sort) q.set('sort', sort);
    return apiFetch(`/api/doctors?${q.toString()}`);
  },

  getDoctorById: (id) => apiFetch(`/api/doctors/${id}`),

  getDoctorSlots: (id, date) => apiFetch(`/api/doctors/${id}/slots?date=${date}`),

  createDoctor: (body, token) =>
    apiFetch('/api/doctors', { method: 'POST', body: JSON.stringify(body) }, token),

  updateDoctor: (id, body, token) =>
    apiFetch(`/api/doctors/${id}`, { method: 'PUT', body: JSON.stringify(body) }, token),

  deleteDoctor: (id, token) =>
    apiFetch(`/api/doctors/${id}`, { method: 'DELETE' }, token),

  // --- Appointments ---
  getAppointments: ({ status = '', sort = '' } = {}, token) => {
    const q = new URLSearchParams();
    if (status) q.set('status', status);
    if (sort) q.set('sort', sort);
    return apiFetch(`/api/appointments?${q.toString()}`, {}, token);
  },

  createAppointment: (body, token) =>
    apiFetch('/api/appointments', { method: 'POST', body: JSON.stringify(body) }, token),

  updateAppointmentStatus: (id, status, token) =>
    apiFetch(`/api/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token),

  deleteAppointment: (id, token) =>
    apiFetch(`/api/appointments/${id}`, { method: 'DELETE' }, token),

  // --- AI ---
  symptomCheck: (symptoms) =>
    apiFetch('/api/ai/symptom-check', { method: 'POST', body: JSON.stringify({ symptoms }) }),
};
