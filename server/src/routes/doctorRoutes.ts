import { Router } from 'express';
import {
  getDoctors,
  getDoctorById,
  getDoctorAvailableSlots,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from '../controllers/doctorController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', getDoctors);
router.get('/:id', getDoctorById);
router.get('/:id/slots', getDoctorAvailableSlots);
router.post('/', authenticate, authorize(['ADMIN']), createDoctor);
router.put('/:id', authenticate, authorize(['ADMIN', 'DOCTOR']), updateDoctor);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteDoctor);

export default router;
