import { Router } from 'express';
import { serviceController } from './service.controller';

const router = Router();

router.get('/', (req, res, next) => serviceController.getAll(req, res, next));
router.get('/deals', (req, res, next) => serviceController.getDeals(req, res, next));
router.post('/deals', (req, res, next) => serviceController.createDeal(req, res, next));
router.delete('/deals/:id', (req, res, next) => serviceController.deleteDeal(req, res, next));

router.get('/products', (req, res, next) => serviceController.getProducts(req, res, next));
router.post('/products', (req, res, next) => serviceController.createProduct(req, res, next));
router.patch('/products/:id/stock', (req, res, next) => serviceController.updateProductStock(req, res, next));

router.get('/:id', (req, res, next) => serviceController.getById(req, res, next));

export default router;
