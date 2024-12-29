import express from 'express';
import authRouter from './authRouter';

export const mainRouter = express.Router();

mainRouter.use("/auth", authRouter);
// mainRouter.use("/logs", logRouter);
