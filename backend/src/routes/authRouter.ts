import express, { Request, Response } from 'express';
import { signIn, signUp } from '../controllers/authController';

const authRouter = express.Router();


authRouter.post("/signup", signUp);
authRouter.post("/signin", signIn);


export default authRouter;