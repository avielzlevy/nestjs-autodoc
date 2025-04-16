// src/gpt.ts
import OpenAI from "openai";

export async function sendEnhancementRequestToGPT(serviceCode: string, dtoCode: string, controllerCode: string, openaiKey: string,model:string = 'gpt-4.1'): Promise<string> {
  const client = new OpenAI({ apiKey: openaiKey });

  try {
    const response = await client.responses.create({
      model,
      instructions: `You are a specialized assistant for documenting NestJS controllers using Swagger decorators.

Only add decorators — never modify method logic or structure.
Always infer and apply relevant documentation decorators according to the following rules:

- Use @ApiTags on every controller to define its category.
- Use @ApiOperation on every method with a clear summary.
- Use @ApiResponse for all expected status codes (200, 201, 400, 401, 404, etc.).
- Use @ApiBearerAuth on protected routes.
- Use @ApiParam when using path parameters, with name, description, and example.
- Use @ApiProperty / @ApiPropertyOptional in all DTO fields with description and example.
- Use @ApiExtraModels when working with generics like PaginatedDto<T>.
- Use @ApiSecurity or @ApiBasicAuth / @ApiCookieAuth / @ApiOAuth2 if appropriate.
- Decorate controller and method levels accordingly.
- Use NestJS OpenAPI decorators only. Return valid TypeScript + NestJS code.
- Output a single code block containing the full updated DTO and Controller.
- Return your output wrapped in a single \`\`\`typescript code block.

If the controller and DTO are already documented correctly according to the rules above, do not return the code again. Instead, reply with exactly:

✅ Already documented
`,
      input: `Service:

${serviceCode}

DTO:

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
