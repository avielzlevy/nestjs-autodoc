// src/gpt.ts
import OpenAI from "openai";

export async function sendEnhancementRequestToGPT(
  serviceCode: string,
  dtoCode: string,
  controllerCode: string,
  openaiKey: string,
  model: string = "gpt-4.1"
): Promise<string> {
  const client = new OpenAI({ apiKey: openaiKey });

  try {
    const response = await client.responses.create({
      model,
      instructions: `
      You will receive three TypeScript files from a NestJS project:

    Service File – Contains business logic including method parameters, return types, and possible exceptions.

    DTO File – Defines the Data Transfer Object classes used for requests and responses.

    Controller File – Contains route definitions and handlers for the API endpoints.

Your task is to analyze the controller file and identify missing or incomplete Swagger decorators, such as:

    @ApiOkResponse, @ApiCreatedResponse, @ApiBadRequestResponse, @ApiNotFoundResponse

    @ApiBody, @ApiQuery, @ApiParam, etc.

Use the service and DTO files to infer the expected behavior, parameters, and responses.

Important notes:

    Some routes may already have partial documentation (e.g., only one decorator applied, or a missing @ApiBody).

        In these cases, suggest the missing decorators only.

    Some routes may be fully documented.

        In these cases, respond clearly with "✅ Already Documented" for that route or method.

    Your output should be written in the style of a code review comment, clearly pointing out:

        What’s missing

        Why it’s needed

        What the suggested decorator(s) should look like (include code snippets)

Be constructive and professional in tone — helpful and specific, just like in a real pull request review.
`,
      //       instructions: `If the controller and DTO are already documented correctly according to the rules above, reply with:

      // ✅ Already documented

      // Otherwise, return following these rules and guidelines:
      // - Use @ApiTags on every controller to define its category.
      // - Use @ApiOperation on every method with a clear summary.
      // - Use @ApiResponse for all expected status codes (200, 201, 400, 401, 404, etc.).
      // - Use @ApiBearerAuth on protected routes.
      // - Use @ApiParam when using path parameters, with name, description, and example.
      // - Use @ApiProperty / @ApiPropertyOptional in all DTO fields with description and example.
      // - Use @ApiExtraModels when working with generics like PaginatedDto<T>.
      // - Use @ApiSecurity or @ApiBasicAuth / @ApiCookieAuth / @ApiOAuth2 if appropriate.

      // 1. A short explanation (in English) of what documentation is missing or incomplete.
      // 2. Write down only the missing decorators, not the code.
      // 3. Since you have access to the service code use it to show your evidence you base your point in TypeScript snippet in its own \`\`\`typescript block.
      // Example:
      // Missing Decorators:
      // @ApiTags('Users')
      // Source:'''typescript
      // @Controller('users')
      // '''
      // @ApiOperation({ summary: 'Get user by ID' })
      // Source: '''@Get(':id')
      // @ApiParam({ name: 'id', description: 'User ID', example: '123' })
      // @ApiResponse({ status: 200, description: 'User found' })
      // '''
      // @ApiResponse({ status: 200, description: 'User found' }
      // `,
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
