import { Router } from 'express';
import { getScan } from '../controllers/scans.controller.js';
import { getFiles } from '../controllers/files.controller.js';

const router = Router();

router.get('/:id', getScan);
router.get('/:scanId/files', getFiles);

export default router;
