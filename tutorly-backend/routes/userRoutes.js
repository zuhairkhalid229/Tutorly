import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { getUserDetails, getSubjects } from '../controllers/userController.js';

const router = express.Router();

router.get('/me', verifyToken, getUserDetails);
router.get('/subjects', getSubjects); // New route to get subjects

export default router;
