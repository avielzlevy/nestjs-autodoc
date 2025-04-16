// src/runner.ts
import { Octokit } from "@octokit/rest";
import * as path from "path";

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

      const decoded = Buffer.from(serviceContent.content, 'base64').toString('utf8');
      console.log(`✅ Found and loaded service for ${controllerPath}`);
      // אפשר לשלוח את decoded ל-GPT בהמשך
    } catch (err) {
      console.log(`⚠️ Could not load service file: ${servicePath}`);
    }
  }

  // בהמשך נוסיף שליחת הקבצים ל-GPT והחזרה עם דוקומנטציה
}