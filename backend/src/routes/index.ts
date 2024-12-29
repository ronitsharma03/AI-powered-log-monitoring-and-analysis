import express from 'express';
import authRouter from './authRouter';
import logRouter from './logRoutes';

export const mainRouter = express.Router();

mainRouter.use("/auth", authRouter);
mainRouter.use("/logs", logRouter);
