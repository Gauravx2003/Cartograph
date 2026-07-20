import { Router } from 'express';
import { 
  exportCsv, 
  createShareLink, 
  getSharedScanMeta, 
  getSharedScanFiles 
} from '../controllers/reports.controller.js';

const router = Router();

// Routes for creating links and exporting CSVs (must be called with valid auth or anonymous session)
router.get('/:scanId/csv', exportCsv);
router.post('/:scanId/link', createShareLink);

// Routes for accessing shared reports (public access based on slug)
router.get('/shared/:slug', getSharedScanMeta);
router.get('/shared/:slug/files', getSharedScanFiles);

export default router;
