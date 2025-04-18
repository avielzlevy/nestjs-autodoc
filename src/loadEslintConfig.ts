// loadEslintConfig.ts
import path from "path";
import fs from "fs";

export async function loadEslintFlatConfig() {
  const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
  const configPath = path.join(workspace, "backend", "eslint.config.cjs");

  if (!fs.existsSync(configPath)) {
    throw new Error(`❌ Config file does not exist at ${configPath}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config = require(configPath);
  return config;
}
