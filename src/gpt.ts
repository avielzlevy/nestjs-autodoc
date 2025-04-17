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

    Service File – Contains business logic, including method parameters, return types, and possible exceptions.

    DTO File – Defines the Data Transfer Object classes used for requests and responses.

    Controller File – Contains route definitions and method handlers.

🎯 Your Task:

Analyze the files and do the following:
✅ Swagger Decorator Tasks:

    Use only the following decorators when documenting:

@ApiBasicAuth()           // Method / Controller  
@ApiBearerAuth()          // Method / Controller  
@ApiBody()                // Method  
@ApiConsumes()            // Method / Controller  
@ApiCookieAuth()          // Method / Controller  
@ApiExcludeController()   // Controller  
@ApiExcludeEndpoint()     // Method  
@ApiExtension()           // Method  
@ApiExtraModels()         // Method / Controller  
@ApiHeader()              // Method / Controller  
@ApiHideProperty()        // Model  
@ApiOAuth2()              // Method / Controller  
@ApiOperation()           // Method  
@ApiParam()               // Method / Controller  
@ApiProduces()            // Method / Controller  
@ApiSchema()              // Model  
@ApiProperty()            // Model  
@ApiPropertyOptional()    // Model  
@ApiQuery()               // Method / Controller  
@ApiResponse()            // Method / Controller  
@ApiSecurity()            // Method / Controller  
@ApiTags()                // Method / Controller  
@ApiCallbacks()           // Method / Controller

    Review each controller method:

        Add missing decorators based on the logic and DTOs.

        If decorators are already complete, respond with:
        ✅ Already Documented

        If decorators are partially complete, add only what’s missing.

🧹 Cleanup:

    Remove all @ApiResponse({ status: 500 }) or similar decorators, as 500 errors are handled globally.

📦 Output Format:

    Return the modified controller file code, with only decorators added, updated, or removed.

        Do not change any business logic or unrelated lines.

    If multiple files are involved, output each one in a separate code block and label them using comments if it doesn't exist already:

    // controller.ts

    Keep all formatting and structure intact.
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
