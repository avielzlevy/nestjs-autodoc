// src/runner.ts
import { Octokit } from "@octokit/rest";
import * as path from "path";
import { sendServiceUnderstandingToGPT, sendEnhancementRequestToGPT } from "./gpt";

export async function runDocEnhancer(
  openaiKey: string,
  githubToken: string,
  owner: string,
  repo: string,
  prNumber: number
) {
  const octokit = new Octokit({ auth: githubToken });

  const { data: pr } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  const headSha = pr.head.sha;

  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber,
  });

  const backendFiles = files
    .map((f) => f.filename)
    .filter((f) =>
      f.startsWith("backend/") &&
      (f.endsWith(".controller.ts") || f.endsWith(".dto.ts"))
    );

  console.log("Detected backend files:", backendFiles);

  const controllers = backendFiles.filter((f) => f.endsWith(".controller.ts"));

  for (const controllerPath of controllers) {
    const baseName = path.basename(controllerPath).replace(".controller.ts", "");
    const servicePath = controllerPath.replace(
      `${baseName}.controller.ts`,
      `${baseName}.service.ts`
    );
    const dtoPath = controllerPath.replace(
      `${baseName}.controller.ts`,
      `${baseName}.dto.ts`
    );

    console.log(`🔎 Looking for matching service: ${servicePath}`);

    try {
      const { data: serviceContent } = await octokit.repos.getContent({
        owner,
        repo,
        path: servicePath,
        ref: headSha,
      });

      if (Array.isArray(serviceContent) || !("content" in serviceContent)) {
        throw new Error("Unexpected content format");
      }

      const decodedService = Buffer.from(serviceContent.content, 'base64').toString('utf8');
      console.log(`✅ Found and loaded service for ${controllerPath}`);

      const understood = await sendServiceUnderstandingToGPT(decodedService, openaiKey);
      if (!understood) {
        console.warn("⚠️ GPT did not confirm understanding of the service file. Aborting flow.");
        continue;
      }

      console.log("✅ GPT understood the service logic. Fetching DTO and Controller...");

      const [dtoFile, controllerFile] = await Promise.all([
        octokit.repos.getContent({ owner, repo, path: dtoPath, ref: headSha }),
        octokit.repos.getContent({ owner, repo, path: controllerPath, ref: headSha })
      ]);

      const decodedDTO = Buffer.from((dtoFile.data as any).content, 'base64').toString('utf8');
      const decodedController = Buffer.from((controllerFile.data as any).content, 'base64').toString('utf8');

      const enhanced = await sendEnhancementRequestToGPT(decodedDTO, decodedController, openaiKey);

      console.log("🎯 Enhanced Documentation:\n", enhanced);

      await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: `### 🤖 הצעה לתיעוד אוטומטי מ-GPT

${"```ts\n" + enhanced.trim() + "\n```"}`,
      });

    } catch (err) {
      console.log(`⚠️ Could not process files for: ${controllerPath}`);
    }
  }
}
