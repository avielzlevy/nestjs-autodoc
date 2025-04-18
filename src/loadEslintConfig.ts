import fs from "fs";
import path from "path";

export async function loadEslintFlatConfig() {
  const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
  const configPath = path.join(workspace, "backend", "eslint.config.cjs");

  if (!fs.existsSync(configPath)) {
    throw new Error(`❌ Config file does not exist at ${configPath}`);
  }

  console.log(`✅ ESLint config loaded: ${configPath}`);

  // Load CommonJS config with require()
  const config = require(configPath);
  return config.default || config;
}
