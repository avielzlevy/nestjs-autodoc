// src/runner.ts
import { Octokit } from "@octokit/rest";
import * as path from "path";
import { sendEnhancementRequestToGPT } from "./gpt";
import { getAppOctokit } from "./authenticateApp";


export async function runDocEnhancer(
    openaiKey: string,
    appId: number,
    privateKey: string,
    installationId: number,
    owner: string,
    repo: string,
    prNumber: number
) {
    const octokit = getAppOctokit(appId, privateKey, installationId);

  const { data: commits } = await octokit.pulls.listCommits({
    owner,
    repo,
    pull_number: prNumber,
  });

  const { data: comments } = await octokit.issues.listComments({
    owner,
    repo,
    issue_number: prNumber,
  });

  for (const commit of commits) {
    const commitSha = commit.sha;
    const shortSha = commitSha.slice(0, 7);

    const alreadyCommented = comments.some((comment) =>
      comment.body?.includes(shortSha)
    );

    if (alreadyCommented) {
      console.log(`⏭️ Skipping commit ${shortSha} – already commented.`);
      continue;
    }

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
        (f.endsWith(".controller.ts") || f.endsWith(".dto.ts") || f.endsWith(".service.ts"))
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

        const isAlreadyGood = /✅\s*already documented/i.test(enhanced);

        const body = isAlreadyGood
          ? `### ✅ Swagger review by GPT (commit: \`${shortSha}\`)

This controller and DTO are already documented properly. No changes needed.`
          : `### 🤖 Auto-generated Swagger documentation suggestion from GPT (commit: \`${shortSha}\`)

${enhanced.trim()}`;

        await octokit.issues.createComment({
          owner,
          repo,
          issue_number: prNumber,
          body,
        });

      } catch (err) {
        console.log(`⚠️ Could not process files for: ${controllerPath}`);
      }
    }
  }
}
