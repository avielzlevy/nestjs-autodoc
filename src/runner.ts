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

  // חיפוש קובץ הסרוויס התואם לכל controller
  const controllers = backendFiles.filter((f) => f.endsWith(".controller.ts"));

  for (const controllerPath of controllers) {
    const baseName = path.basename(controllerPath).replace(".controller.ts", "");
    const servicePath = controllerPath.replace(
      `${baseName}.controller.ts`,
      `${baseName}.service.ts`
    );

    console.log(`🔎 Looking for matching service: ${servicePath}`);
    const matchingFile = files.find((f) => f.filename === servicePath);
    if (matchingFile) {
      console.log(`✅ Found service for ${controllerPath}: ${servicePath}`);
    } else {
      console.log(`⚠️ No matching service found for ${controllerPath}`);
    }
  }

  // בהמשך נוסיף שליחת הקבצים ל-GPT והחזרה עם דוקומנטציה
}