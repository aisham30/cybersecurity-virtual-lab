'use strict';
/**
 * CLI validation script for experiment authoring.
 * Usage: node tests/validate-experiments.js
 */
const path = require('path');
const manifestLoader = require('../app/main/manifestLoader');

const expDir = path.resolve(__dirname, '../experiments');
console.log(`\n🔍 Scanning experiments in: ${expDir}\n`);

const res = manifestLoader.loadAll(expDir);

if (res.error) {
  console.error(`❌ Error scanning folder: ${res.error}`);
  process.exit(1);
}

let hasErrors = false;

res.experiments.forEach((exp) => {
  if (exp.valid) {
    console.log(`✅ [${exp.id}] ${exp.manifest.name} — VALID`);
    if (exp.warnings.length) {
      exp.warnings.forEach((w) => console.log(`   ⚠️ Warning: ${w}`));
    }
  } else {
    hasErrors = true;
    console.error(`❌ [${exp.id}] ${exp.folder} — INVALID`);
    exp.errors.forEach((e) => console.error(`   ⛔ Error: ${e}`));
  }
});

console.log(`\nTotal experiments found: ${res.experiments.length}`);
if (hasErrors) {
  console.error('\n❌ Validation failed for one or more experiments.\n');
  process.exit(1);
} else {
  console.log('\n✨ All experiment manifests and configurations are valid!\n');
  process.exit(0);
}
