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
Your role is to validate whether the Swagger documentation has been correctly applied, following the rules listed below. If something is missing, report it using the structured format described.
 Only review and add decorators — do not modify the logic or structure of methods.
 Validation Rules (only NestJS Swagger decorators):

    Use @ApiTags() on every controller to define its category.

    Use @ApiOperation() on every method with a clear summary.

    Use @ApiResponse() for all expected status codes (200, 201, 400, 401, 404, etc.).

    Use @ApiBearerAuth() on protected routes.

    Use @ApiParam() for path parameters with name, description, and example.

    Use @ApiProperty() or @ApiPropertyOptional() in all DTO fields with description and example.

    Use @ApiExtraModels() when using generics (e.g., PaginatedDto<T>).

    Use other relevant decorators like @ApiSecurity(), @ApiBasicAuth(), @ApiCookieAuth(), or @ApiOAuth2() as needed.

    Return each file wrapped in a single typescript code block.

 Output Rules:

    If a file is missing decorators, return a section like this:

[File]
Dto {className} is missing the following:
1. Missing @ApiProperty on field 'firstName' (description + example).
2. Missing @ApiPropertyOptional on field 'middleName' (description + example).
3. Missing @ApiExtraModels due to usage of generics.

Controller {controllerName} is missing the following:
1. Missing @ApiTags at the class level.
2. Method 'getUser' is missing @ApiOperation.
3. Method 'updateUser' is missing @ApiResponse for 404.

Endpoint getUser-GET /users/:id is missing the following:
1. Missing @ApiParam for parameter 'id' with description and example.

    If everything is already correctly documented, return only:

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
