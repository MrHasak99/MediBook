import { Router } from 'express';
import {
  getSpecialties,
  getSpecialtyById,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
} from '../controllers/specialtyController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', getSpecialties);
router.get('/:id', getSpecialtyById);
router.post('/', authenticate, authorize(['ADMIN']), createSpecialty);
router.put('/:id', authenticate, authorize(['ADMIN']), updateSpecialty);
router.delete('/:id', authenticate, authorize(['ADMIN']), deleteSpecialty);

export default router;
