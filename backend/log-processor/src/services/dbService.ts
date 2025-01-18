import prisma from "../config/prismaConfig";

interface logMessageType {
    key: string;
    element: string;
}
export const saveLogsAndAnalysis = async (logMessage: logMessageType, logAnalysis: string) => {
    try{
        await prisma.log.create({
            data: {
                logMessage: logMessage.element,
                analysis: logAnalysis,
                isAnalysed: logAnalysis ? "Success" : "Pending"
            }
        });

        console.log("Saved to DB");
    }catch(error){
        console.log("Error saving to the DB");
    }
}