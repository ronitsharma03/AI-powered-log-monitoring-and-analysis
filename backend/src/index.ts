import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { dbConnect } from './lib/dbConnect';
import { mainRouter } from './routes';

const app = express();

app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 3000;
config();

dbConnect();

app.use("/api/v1", mainRouter);

app.get("/health", (req: Request, res: Response) => {
    res.json({
        message: "Health is good !"
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
})