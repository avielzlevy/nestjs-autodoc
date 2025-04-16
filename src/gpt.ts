// src/gpt.ts
import OpenAI from "openai";

export async function sendServiceUnderstandingToGPT(serviceCode: string, openaiKey: string): Promise<boolean> {
  const client = new OpenAI({ apiKey: openaiKey });

  try {
    const response = await client.responses.create({
      model: "gpt-4.1",
      instructions: "אתה עוזר מפתח שמתעד קוד NestJS. בשלב הזה אתה רק צריך להבין את הקוד – אל תבצע כל פעולה אחרת. רק תגיד אם הבנת.",
      input: `הנה קובץ הסרוויס:

${serviceCode}`,
    });

    console.log("🤖 GPT raw output:", response.output_text);

    return /הבנתי|understood|ready/i.test(response.output_text);
  } catch (err) {
    console.error("❌ Error while calling GPT:", err);
    return false;
  }
}

export async function sendEnhancementRequestToGPT(dtoCode: string, controllerCode: string, openaiKey: string): Promise<string> {
  const client = new OpenAI({ apiKey: openaiKey });

  try {
    const response = await client.responses.create({
      model: "gpt-4.1",
      instructions: "קח את הקוד הבא (DTO וקונטרולר) והוסף לו דקורייטורים של Swagger, כולל @ApiProperty ו-@ApiOperation לפי ההקשר. תחזיר את הקוד כולו מתועד כמו שצריך.",
      input: `DTO:

${dtoCode}

Controller:

${controllerCode}`,
    });

    console.log("🧠 GPT enhanced output:", response.output_text);

    return response.output_text;
  } catch (err) {
    console.error("❌ Error while sending enhancement request to GPT:", err);
    return "";
  }
}
