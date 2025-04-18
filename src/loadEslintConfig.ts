import path from "path";
import fs from "fs";

export async function loadEslintFlatConfig() {
  const configPath = path.join(process.env.GITHUB_WORKSPACE || process.cwd(), "backend/eslint.config.mjs");
  const content = fs.readFileSync(configPath, "utf-8");
  const stripped = content.replace(/export\s+default\s+/, "module.exports = ");

  const tempPath = path.join("/tmp", "eslint.config.cjs");
  fs.writeFileSync(tempPath, stripped, "utf-8");

  return require(tempPath); // Not ESM import — works with `ncc`
}
