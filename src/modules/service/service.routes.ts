import { Router } from 'express';
import { serviceController } from './service.controller';

const router = Router();

router.get('/', (req, res, next) => serviceController.getAll(req, res, next));
router.get('/:id', (req, res, next) => serviceController.getById(req, res, next));

export default router;
