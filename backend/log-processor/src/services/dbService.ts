import prisma from "../config/prismaConfig";

interface logMessageType {
    key: string;
    element: string;
}
export const saveLogsAndAnalysis = async (logMessage: logMessageType, logAnalysis: string) => {
    try{
        const jsonAnalysis = JSON.parse(logAnalysis);
        const response = await prisma.log.create({
            data: {
                logMessage: logMessage.element,
                analysis: jsonAnalysis,
                isAnalysed: logAnalysis ? "Success" : "Pending",
                source: jsonAnalysis.breakdown.module || "No module found"
            }
        });
        // console.log(response.id)
        console.log("Log and its analysis saved to database");
        return response.id;
    }catch(error){
        console.log("Error saving to the database", error);
    }
}