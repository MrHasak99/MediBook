import { z } from 'zod';
import { supabaseAdmin } from '../utils/supabase.js';

const doctorSchema = z.object({
  specialty_id: z.string().uuid('Invalid specialty ID'),
  bio: z.string().optional(),
  experience_years: z.number().min(0).max(60).optional(),
});

// GET /api/doctors — with search, filter by specialty
export const getDoctors = async (req, res) => {
  const { search, specialty_id, sort } = req.query;

  let query = supabaseAdmin
    .from('doctors')
    .select('*, profiles(id, name, email), specialties(id, name, description)')
    .order('created_at', { ascending: sort === 'asc' });

  if (specialty_id && typeof specialty_id === 'string') {
    query = query.eq('specialty_id', specialty_id);
  }

  const { data, error } = await query;

  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }

  // Filter by doctor name after fetching (Supabase doesn't support ilike on joined tables easily)
  let result = data ?? [];
  if (search && typeof search === 'string') {
    const term = search.toLowerCase();
    result = result.filter((d) =>
      d.profiles?.name?.toLowerCase().includes(term)
    );
  }

  res.json({ data: result });
};

// GET /api/doctors/:id
export const getDoctorById = async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from('doctors')
    .select('*, profiles(id, name, email), specialties(id, name, description)')
    .eq('id', id)
    .single();

  if (error || !data) {
    res.status(404).json({ message: 'Doctor not found' });
    return;
  }

  res.json({ data });
};

// GET /api/doctors/:id/slots?date=YYYY-MM-DD
export const getDoctorAvailableSlots = async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;

  if (!date || typeof date !== 'string') {
    res.status(400).json({ message: 'Date query parameter is required (YYYY-MM-DD)' });
    return;
  }

  // Fixed working hours 09:00–17:00, 30-min slots
  const allSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30',
  ];

  const { data: booked } = await supabaseAdmin
    .from('appointments')
    .select('start_time')
    .eq('doctor_id', id)
    .eq('appointment_date', date)
    .in('status', ['PENDING', 'CONFIRMED']);

  const bookedTimes = new Set((booked ?? []).map((a) => a.start_time.slice(0, 5)));
  const available = allSlots.filter((slot) => !bookedTimes.has(slot));

  res.json({ data: available, date });
};

// POST /api/doctors — Admin registers a user as doctor
export const createDoctor = async (req, res) => {
  const result = doctorSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ message: 'Validation error', errors: result.error.flatten() });
    return;
  }

  const { profile_id } = req.body;

  if (!profile_id) {
    res.status(400).json({ message: 'profile_id is required' });
    return;
  }

  // Update profile role to DOCTOR
  await supabaseAdmin.from('profiles').update({ role: 'DOCTOR' }).eq('id', profile_id);

  const { data, error } = await supabaseAdmin
    .from('doctors')
    .insert({ profile_id, ...result.data })
    .select('*, profiles(id, name, email), specialties(id, name)')
    .single();

  if (error) {
    res.status(400).json({ message: error.message });
    return;
  }

  res.status(201).json({ data });
};

// PUT /api/doctors/:id
export const updateDoctor = async (req, res) => {
  const { id } = req.params;
  const result = doctorSchema.partial().safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ message: 'Validation error', errors: result.error.flatten() });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('doctors')
    .update(result.data)
    .eq('id', id)
    .select('*, profiles(id, name, email), specialties(id, name)')
    .single();

  if (error || !data) {
    res.status(404).json({ message: 'Doctor not found' });
    return;
  }

  res.json({ data });
};

// DELETE /api/doctors/:id
export const deleteDoctor = async (req, res) => {
  const { id } = req.params;

  const { error } = await supabaseAdmin.from('doctors').delete().eq('id', id);

  if (error) {
    res.status(400).json({ message: error.message });
    return;
  }

  res.json({ message: 'Doctor removed successfully' });
};
