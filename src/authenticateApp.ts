// src/authenticateApp.ts
import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

export function getAppOctokit(): Octokit {
    const appId = Number(process.env.GH_APP_ID);
    const privateKey = process.env.GH_APP_PRIVATE_KEY!;
    const installationId = Number(process.env.GH_APP_INSTALLATION_ID);
  
    return new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId,
        privateKey,
        installationId,
      },
    });
  }
  