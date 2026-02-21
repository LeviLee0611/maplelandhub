import fs from "fs";
import path from "path";
import vm from "vm";

const rawPath = path.resolve("data/raw/skills.raw.ts");
const outDir = path.resolve("data/skills");

const rawText = fs.readFileSync(rawPath, "utf8");
const scriptText = rawText.replace(/\bconst\b/g, "var");

const context = {};
vm.createContext(context);
vm.runInContext(scriptText, context, { timeout: 1000 });

const mappings = [
  "mainSkillMapping",
  "weaponMapping",
  "range20",
  "range30",
  "venomSkill",
  "damageMapping",
  "sharpEyesMapping",
  "criticalThrowMapping",
  "damageMappingActive",
  "damageMappingActive2",
];

fs.mkdirSync(outDir, { recursive: true });

for (const key of mappings) {
  if (!(key in context)) continue;
  const value = context[key];
  const outPath = path.join(outDir, `${key}.json`);
  fs.writeFileSync(outPath, JSON.stringify(value, null, 2));
  console.log(`Wrote ${outPath}`);
}
