import { Router } from 'express';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} from '../controllers/appointmentController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getAppointments);
router.get('/:id', getAppointmentById);
router.post('/', authorize(['PATIENT']), createAppointment);
router.patch('/:id/status', updateAppointmentStatus);
router.delete('/:id', authorize(['ADMIN']), deleteAppointment);

export default router;
