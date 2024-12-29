import mongoose from "mongoose";

export const dbConnect = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URL!);
        console.log("Connected to the database");
    }catch(error){
        console.log("Error connecting to the database");
        console.log(error);
    }
}