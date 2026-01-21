import { SolapiMessageService } from "solapi";

// Initialize Solapi Service
// Note: Errors here might crash build time if envs are missing, so we use a safe getter.
const getSolapiService = () => {
    const apiKey = process.env.SOLAPI_API_KEY;
    const apiSecret = process.env.SOLAPI_API_SECRET;

    if (!apiKey || !apiSecret) {
        console.warn("Solapi credentials not found in environment variables.");
        return null;
    }

    return new SolapiMessageService(apiKey, apiSecret);
};

export interface SendMessageParams {
    to: string;       // Recipient Phone Number
    from?: string;    // Sender Phone Number (Optional, defaults to env)
    text: string;     // Message Content
    type?: 'SMS' | 'LMS' | 'MMS' | 'ATA' | 'CTA' | 'CTI'; // ATA = AlimTalk, SMS = Short Message
    kakaoOptions?: {
        pfId: string;        // Kakao Channel ID (PfID) - Required for AlimTalk
        templateId: string;  // Template ID - Required for AlimTalk
        variables?: Record<string, string>;
    }
}

export async function sendMessage({ to, from, text, type = 'SMS', kakaoOptions }: SendMessageParams) {
    const messageService = getSolapiService();
    if (!messageService) {
        return { success: false, error: "Solapi Client Not Initialized" };
    }

    const sender = from || process.env.SOLAPI_SENDER_NUMBER;
    if (!sender) {
        return { success: false, error: "Sender number (from) is required" };
    }

    try {
        // Construct Message Object
        const messageObj: any = {
            to,
            from: sender,
            text,
            type // 'SMS' default, can be 'ATA' (AlimTalk)
        };

        // If AlimTalk, add specific options
        if (type === 'ATA' && kakaoOptions) {
            messageObj.kakaoOptions = {
                pfId: kakaoOptions.pfId,
                templateId: kakaoOptions.templateId,
                variables: kakaoOptions.variables,
                disableSms: false // If true, won't fall back to SMS on failure
            };
        }

        const result = await messageService.send(messageObj);
        console.log("Solapi Send Result:", result);
        return { success: true, data: result };

    } catch (error: any) {
        console.error("Solapi Send Error:", error);
        return { success: false, error: error.message };
    }
}
