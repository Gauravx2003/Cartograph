import { Router } from 'express';
import { createRepo, getRepos } from '../controllers/repos.controller.js';
import { createScan } from '../controllers/scans.controller.js';

const router = Router();

router.post('/', createRepo);
router.get('/', getRepos);
router.post('/:repoId/scans', createScan);

export default router;
