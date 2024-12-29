import { Request, Response } from 'express';
import { user } from '../models/Schema';
import bcrypt from "bcrypt"
import { z } from "zod";
import jwt from "jsonwebtoken";

export const signUp = async (req: Request, res: Response): Promise<any> => {
    const inputSchema = z.object({
        name: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(6)
    });

    const { success, data } = inputSchema.safeParse(req.body);

    if(!success){
        return res.status(400).json({
            message: "Wrong Inputs"
        });
    }
    try {
        const { email, name, password } = data;
        const existingUser = await user.findOne({
            email: email
        });

        if(existingUser){
            return res.json({
                message: "Email already taken"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await user.create({
            email,
            name,
            password: hashedPassword
        });

        const userId = newUser._id;

        const token = await jwt.sign({
            userId
        }, process.env.JWT_SECRET!);

        return res.json({
            message: "Signup successful",
            user: newUser,
            token: token
        });

    }catch(error){
        console.log(error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }
}


export const signIn = async (req: Request, res: Response): Promise<any> => {
    const inputSchema = z.object({
        email: z.string().email(),
        password: z.string().min(6)
    });

    const { success, data } = inputSchema.safeParse(req.body);

    if(!success){
        return res.status(400).json({
            message: "Wrong Inputs"
        });
    }

    try {
        const { email, password } = data;
        const signingUser = await user.findOne({
            email: email
        });

        if(!signingUser){
            return res.status(400).json({
                message: "User not found"
            });
        }
        const isValid = await bcrypt.compare(password, signingUser.password);
        if(!isValid){
            return res.status(400).json({
                message: "Invalid password"
            });
        }

        const token = await jwt.sign({
            userId: signingUser._id
        }, process.env.JWT_SECRET!);

        return res.json({
            message: "Signin successful",
            user: signingUser,
            token: token
        });

    }catch(error){
        console.log(error);
        return res.status(500).json({
            message: "Internal Server Error"
        });
    }

}