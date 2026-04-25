import { Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../utils/supabase';

const specialtySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
});

// GET /api/specialties
export const getSpecialties = async (req: Request, res: Response): Promise<void> => {
  const { search } = req.query;

  let query = supabaseAdmin.from('specialties').select('*').order('name');

  if (search && typeof search === 'string') {
    query = query.ilike('name', `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    res.status(500).json({ message: error.message });
    return;
  }

  res.json({ data });
};

// GET /api/specialties/:id
export const getSpecialtyById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from('specialties')
    .select('*, doctors(*, profiles(id, name, email))')
    .eq('id', id)
    .single();

  if (error || !data) {
    res.status(404).json({ message: 'Specialty not found' });
    return;
  }

  res.json({ data });
};

// POST /api/specialties
export const createSpecialty = async (req: Request, res: Response): Promise<void> => {
  const result = specialtySchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ message: 'Validation error', errors: result.error.flatten() });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('specialties')
    .insert(result.data)
    .select()
    .single();

  if (error) {
    res.status(400).json({ message: error.message });
    return;
  }

  res.status(201).json({ data });
};

// PUT /api/specialties/:id
export const updateSpecialty = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const result = specialtySchema.partial().safeParse(req.body);

  if (!result.success) {
    res.status(400).json({ message: 'Validation error', errors: result.error.flatten() });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('specialties')
    .update(result.data)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    res.status(404).json({ message: 'Specialty not found' });
    return;
  }

  res.json({ data });
};

// DELETE /api/specialties/:id
export const deleteSpecialty = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const { error } = await supabaseAdmin
    .from('specialties')
    .delete()
    .eq('id', id);

  if (error) {
    res.status(400).json({ message: error.message });
    return;
  }

  res.json({ message: 'Specialty deleted successfully' });
};
