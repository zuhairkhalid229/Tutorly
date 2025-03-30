import express from 'express';
import { verifyToken } from '../middleware/authMiddleware.js';
import { getUserDetails } from '../controllers/userController.js';

const router = express.Router();

router.get('/me', verifyToken, getUserDetails);

export default router;
