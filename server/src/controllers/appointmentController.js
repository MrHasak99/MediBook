import { z } from 'zod';
import { supabaseAdmin } from '../utils/supabase.js';

const createAppointmentSchema = z.object({
  doctor_id: z.string().uuid('Invalid doctor ID'),
  appointment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  reason: z.string().min(3, 'Please describe your reason for visit').max(500).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']),
});

function addMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0) + minutes;
  const newH = Math.floor(total / 60).toString().padStart(2, '0');
  const newM = (total % 60).toString().padStart(2, '0');
  return `${newH}:${newM}`;
}

// GET /api/appointments — patient sees own, doctor sees own
export const getAppointments = async (req, res) => {
  const user = req.user;
  const { status, sort } = req.query;
  const sortOrder = sort === 'asc';

  let query = supabaseAdmin
    .from('appointments')
    .select(`
      *,
      doctors(id, bio, experience_years, specialties(name), profiles(name, email)),
      profiles!appointments_patient_id_fkey(id, name, email)
    `)
    .order('appointment_date', { ascending: sortOrder });

  if (user.role === 'PATIENT') {
    query = query.eq('patient_id', user.id);
  } else if (user.role === 'DOCTOR') {
    // Find doctor record for this user
    const { data: doctor } = await supabaseAdmin
      .from('doctors')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    if (!doctor) {
      res.status(404).json({ message: 'Doctor profile not found' });
      return;
    }
    query = query.eq('doctor_id', doctor.id);
  }
  // ADMIN sees all — no filter

  if (status && typeof status === 'string') {
    query = query.eq('status', status.toUpperCase());
  }

  const { data, error } = await query;

  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }

  res.json({ data: data ?? [] });
};

// GET /api/appointments/:id
export const getAppointmentById = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .select(`
      *,
      doctors(id, bio, experience_years, specialties(name), profiles(name, email)),
      profiles!appointments_patient_id_fkey(id, name, email)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    res.status(404).json({ message: 'Appointment not found' });
    return;
  }

  // Authorization check
  const isPatient = user.role === 'PATIENT' && data.patient_id === user.id;
  const isAdmin = user.role === 'ADMIN';
  if (!isPatient && !isAdmin && user.role !== 'DOCTOR') {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  res.json({ data });
};

// POST /api/appointments
export const createAppointment = async (req, res) => {
  const user = req.user;

  if (user.role !== 'PATIENT') {
    res.status(403).json({ message: 'Only patients can book appointments' });
    return;
  }

  const result = createAppointmentSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ message: 'Validation error', errors: result.error.flatten() });
    return;
  }

  const { doctor_id, appointment_date, start_time, reason } = result.data;
  const end_time = addMinutes(start_time, 30);

  // Check for booking conflict
  const { data: conflict } = await supabaseAdmin
    .from('appointments')
    .select('id')
    .eq('doctor_id', doctor_id)
    .eq('appointment_date', appointment_date)
    .eq('start_time', `${start_time}:00`)
    .in('status', ['PENDING', 'CONFIRMED'])
    .single();

  if (conflict) {
    res.status(409).json({ message: 'This time slot is already booked. Please choose another.' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .insert({
      patient_id: user.id,
      doctor_id,
      appointment_date,
      start_time: `${start_time}:00`,
      end_time: `${end_time}:00`,
      reason,
      status: 'PENDING',
    })
    .select(`
      *,
      doctors(id, specialties(name), profiles(name, email)),
      profiles!appointments_patient_id_fkey(id, name, email)
    `)
    .single();

  if (error) {
    res.status(400).json({ message: error.message });
    return;
  }

  res.status(201).json({ data });
};

// PATCH /api/appointments/:id/status
export const updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const result = updateStatusSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ message: 'Validation error', errors: result.error.flatten() });
    return;
  }

  const { status } = result.data;

  // Fetch appointment to check ownership
  const { data: appointment } = await supabaseAdmin
    .from('appointments')
    .select('patient_id, doctor_id, doctors(profile_id)')
    .eq('id', id)
    .single();

  if (!appointment) {
    res.status(404).json({ message: 'Appointment not found' });
    return;
  }

  // Patients can only cancel their own
  if (user.role === 'PATIENT') {
    if (appointment.patient_id !== user.id) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    if (status !== 'CANCELLED') {
      res.status(403).json({ message: 'Patients can only cancel appointments' });
      return;
    }
  }

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    res.status(400).json({ message: error.message });
    return;
  }

  res.json({ data });
};

// DELETE /api/appointments/:id — Admin only
export const deleteAppointment = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin.from('appointments').delete().eq('id', id);

  if (error) {
    res.status(400).json({ message: error.message });
    return;
  }

  res.json({ message: 'Appointment deleted' });
};
