import path from "path";
import fs from "fs";
import { createRequire } from "module";

export function loadEslintFlatConfig(backendDir: string): any {
  const configPath = path.resolve(backendDir, "eslint.config.cjs");
  const requireFromRuntime = createRequire(__filename);

  if (!fs.existsSync(configPath)) {
    throw new Error(`❌ Config file does not exist at ${configPath}`);
  }

  console.log(`✅ ESLint config loaded: ${configPath}`);
  return requireFromRuntime(configPath);
}
