import prisma from "../config/prismaConfig";

interface logMessageType {
    key: string;
    element: string;
}
export const saveLogsAndAnalysis = async (logMessage: logMessageType, logAnalysis: string) => {
    try{
        const jsonAnalysis = JSON.parse(logAnalysis);
        await prisma.log.create({
            data: {
                logMessage: logMessage.element,
                analysis: logAnalysis,
                isAnalysed: logAnalysis ? "Success" : "Pending"
            }
        });

        console.log("Log and its analysis saved to database");
    }catch(error){
        console.log("Error saving to the database");
    }
}