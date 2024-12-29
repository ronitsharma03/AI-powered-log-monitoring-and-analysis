import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET;


interface AuthenticatedRequest extends Request {
    userId?: string;
}

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!(authHeader && authHeader.startsWith('Bearer'))) {
        return res.status(403).json({
            message: "Wrong headers!"
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET!) as { userId: string};

        if (decoded.userId) {
            req.userId = decoded.userId;
            next();
        }
        else {
            return res.status(403).json({
                message: "Authorization Error"
            });
        }
    } catch (e) {
        return res.status(403).json({
            message: "Something went wrong"
        });
    }
}

module.exports = {
    authMiddleware
};