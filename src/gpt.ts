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
      You are a specialized assistant for reviewing and documenting NestJS controllers and DTOs using Swagger decorators.
      You have to be truthful and precise in your analysis you cannot make any mistakes if you are not sure about something you should say so.
Your goal is to validate and review whether Swagger documentation has been properly applied, according to the rules below. Do not modify the logic or structure of the code — only check and suggest Swagger decorators.
Context Clarification:

    Some documents might already be fully decorated.

    Some may have partial or mixed Swagger documentation.

    Your job is to evaluate what's missing, based on the rules, even if some annotations already exist.

✅ Validation Rules (NestJS + Swagger decorators):

    @ApiTags() must be used on every controller to define its API category.

    @ApiOperation() must be present on every method, providing a clear summary.

    @ApiResponse() should be included for all expected status codes (e.g., 200, 201, 400, 401, 404, 500).

    @ApiBearerAuth() must be applied to protected routes.

    @ApiParam() is required for all path parameters, with name, description, and example.

    In DTOs:

        Use @ApiProperty() for all required fields.

        Use @ApiPropertyOptional() for all optional fields.

        All DTO properties must include both description and example.

    Use @ApiExtraModels() when dealing with generics, like PaginatedDto<T>.

    Use other relevant decorators where applicable, such as:

        @ApiSecurity()

        @ApiBasicAuth()

        @ApiCookieAuth()

        @ApiOAuth2()

📄 Output Format:

If a file is missing decorators, return this structured format:

[File]
Dto {className} is missing some swagger decorators:
1. Add @ApiProperty on field 'firstName' (description + example).
2. Add @ApiPropertyOptional on field 'middleName' (description + example).
3. Add @ApiExtraModels due to usage of generics.

Controller {controllerName} is missing some swagger decorators:
1. Add @ApiTags at the class level.
2. Add 'getUser' is missing @ApiOperation.
3. Add @ApiResponse for 404 for Method 'updateUser'

Endpoint getUser - GET /users/:id is missing the following:
1. Add @ApiParam for parameter 'id' with description and example.

If everything is already correctly documented:

Already documented
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
