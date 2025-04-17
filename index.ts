// index.ts
import * as core from "@actions/core";
import * as github from "@actions/github";
import { runDocEnhancer } from "./src/runner";

(async () => {
  try {
    const openaiKey = core.getInput("openai_key", { required: true });
    const appId = Number(core.getInput("gh_app_id", { required: true }));
    const privateKey = core.getInput("gh_app_private_key", { required: true });
    const model = core.getInput("model") || "gpt-4.1";
    const allowedModels = ["gpt-4.1", "gpt-4.1-mini", "gpt-4.1-nano", "gpt-4o",'gpt-4o-mini'];
    if (!allowedModels.includes(model)) {
      throw new Error(
        `Invalid model: ${model}. Must be one of: ${allowedModels.join(", ")}`
      );
    }
    const installationId = Number(
      core.getInput("gh_app_installation_id", { required: true })
    );

    const context = github.context;

    if (!context.payload.pull_request) {
      core.setFailed("No pull request context found.");
      return;
    }

    const prNumber = context.payload.pull_request.number;
    const repo = context.repo;

    console.log(
      `Running doc enhancer on PR #${prNumber} in ${repo.owner}/${repo.repo}`
    );

    await runDocEnhancer(
      openaiKey,
      appId,
      privateKey,
      installationId,
      repo.owner,
      repo.repo,
      prNumber,
      model
    );
  } catch (error: any) {
    console.error("Error:", error);
    core.setFailed(error.message);
  }
})();
