import { Router } from 'express';
import { pharmacyController } from './pharmacy.controller';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { requireRoles } from '../../common/middleware/rbac.middleware';

const router = Router();

// Invariant: Pharmacy operations require authentication
router.use(authMiddleware);
router.use(requireRoles('PHARMACIST', 'ADMIN'));

// Dispense Queue & Rx Fulfillment
router.get('/queue', (req, res, next) => pharmacyController.getDispenseQueue(req, res, next));
router.post('/dispense', (req, res, next) => pharmacyController.dispensePrescription(req, res, next));

// Drug Inventory Vault
router.get('/inventory', (req, res, next) => pharmacyController.getInventory(req, res, next));
router.post('/inventory', (req, res, next) => pharmacyController.saveMedicine(req, res, next));

// OTC Point of Sale (POS) Billing
router.post('/pos', (req, res, next) => pharmacyController.processPosSale(req, res, next));

// Drug Safety & Interaction Screener
router.post('/safety-check', (req, res, next) => pharmacyController.checkDrugSafety(req, res, next));

// Distributor Procurement & Shipment Receiving
router.get('/procurement', (req, res, next) => pharmacyController.getProcurementOrders(req, res, next));
router.post('/procurement/:orderId/receive', (req, res, next) => pharmacyController.receiveProcurementOrder(req, res, next));

export default router;
