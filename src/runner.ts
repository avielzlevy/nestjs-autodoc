// src/runner.ts
import { Octokit } from "@octokit/rest";
import * as path from "path";
import { sendEnhancementRequestToGPT } from "./gpt";

export async function runDocEnhancer(
  openaiKey: string,
  githubToken: string,
  owner: string,
  repo: string,
  prNumber: number
) {
  const octokit = new Octokit({ auth: githubToken });

  const { data: commits } = await octokit.pulls.listCommits({
    owner,
    repo,
    pull_number: prNumber,
  });

  for (const commit of commits) {
    const commitSha = commit.sha;
    console.log(`🔍 Checking commit ${commitSha}`);

    const { data: files } = await octokit.repos.getCommit({
      owner,
      repo,
      ref: commitSha,
    });

    const backendFiles = files.files
      ?.map((f) => f.filename)
      .filter((f) =>
        f.startsWith("backend/") &&
        (f.endsWith(".controller.ts") || f.endsWith(".dto.ts"))
      ) || [];

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
        const [serviceFile, dtoFile, controllerFile] = await Promise.all([
          octokit.repos.getContent({ owner, repo, path: servicePath, ref: commitSha }),
          octokit.repos.getContent({ owner, repo, path: dtoPath, ref: commitSha }),
          octokit.repos.getContent({ owner, repo, path: controllerPath, ref: commitSha })
        ]);

        const decodedService = Buffer.from((serviceFile.data as any).content, 'base64').toString('utf8');
        const decodedDTO = Buffer.from((dtoFile.data as any).content, 'base64').toString('utf8');
        const decodedController = Buffer.from((controllerFile.data as any).content, 'base64').toString('utf8');

        const enhanced = await sendEnhancementRequestToGPT(decodedService, decodedDTO, decodedController, openaiKey);

        console.log("🎯 Enhanced Documentation:\n", enhanced);

        await octokit.issues.createComment({
          owner,
          repo,
          issue_number: prNumber,
          body: `### 🤖 Auto-generated Swagger documentation suggestion from GPT (commit: \`${commitSha.slice(0, 7)}\`)

${"```ts\n" + enhanced.trim() + "\n```"}`,
        });

      } catch (err) {
        console.log(`⚠️ Could not process files for: ${controllerPath}`);
      }
    }
  }
}