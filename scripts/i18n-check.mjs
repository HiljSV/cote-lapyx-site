#!/usr/bin/env node
// i18n-check.mjs — validates i18n consistency across JSON bundles and HTML files
// Checks: missing keys, extra keys, empty values, broken data-i18n* references
// Run: npm run i18n:check

import { readFileSync, readdirSync } from "fs";
import { resolve, join } from "path";
import { glob } from "glob";

const ROOT = resolve(import.meta.dirname, "..");
const I18N_DIR = join(ROOT, "src/i18n");
const HTML_GLOB = join(ROOT, "src/**/*.html");
const LANGS = ["uk", "en", "fr", "de"];
const REFERENCE_LANG = "uk";

let errors = 0;
let warnings = 0;

function error(msg) {
  console.error(`  ✗ ${msg}`);
  errors++;
}

function warn(msg) {
  console.warn(`  ⚠ ${msg}`);
  warnings++;
}

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

// ── Load all JSON bundles ────────────────────────────────────────────────────

console.log("\n── JSON bundles ────────────────────────────────────────────");
const bundles = {};
for (const lang of LANGS) {
  const path = join(I18N_DIR, `${lang}.json`);
  try {
    bundles[lang] = JSON.parse(readFileSync(path, "utf-8"));
    ok(`${lang}.json loaded — ${Object.keys(bundles[lang]).length} keys`);
  } catch (e) {
    error(`${lang}.json failed to parse: ${e.message}`);
    process.exit(1);
  }
}

// ── Key consistency across all languages ────────────────────────────────────

console.log("\n── Key consistency ─────────────────────────────────────────");
const refKeys = new Set(Object.keys(bundles[REFERENCE_LANG]));

for (const lang of LANGS) {
  if (lang === REFERENCE_LANG) continue;
  const keys = new Set(Object.keys(bundles[lang]));

  // Missing in this lang
  for (const k of refKeys) {
    if (!keys.has(k)) error(`${lang}.json missing key: "${k}"`);
  }
  // Extra in this lang (not in reference)
  for (const k of keys) {
    if (!refKeys.has(k))
      warn(`${lang}.json has extra key not in ${REFERENCE_LANG}.json: "${k}"`);
  }

  const missing = [...refKeys].filter((k) => !keys.has(k)).length;
  const extra = [...keys].filter((k) => !refKeys.has(k)).length;
  if (missing === 0 && extra === 0)
    ok(`${lang}.json — keys match ${REFERENCE_LANG}.json`);
}

// ── Empty / null / undefined values ─────────────────────────────────────────

console.log("\n── Empty values ─────────────────────────────────────────────");
let emptyTotal = 0;
for (const lang of LANGS) {
  let emptyInLang = 0;
  for (const [key, val] of Object.entries(bundles[lang])) {
    if (val === null || val === undefined || val === "") {
      error(`${lang}.json empty value for key: "${key}"`);
      emptyInLang++;
      emptyTotal++;
    }
  }
  if (emptyInLang === 0) ok(`${lang}.json — no empty values`);
}

// ── HTML: extract all data-i18n* keys ────────────────────────────────────────

console.log("\n── HTML data-i18n references ────────────────────────────────");

const htmlFiles = await glob(HTML_GLOB, { ignore: "**/node_modules/**" });
const usedKeys = {
  "data-i18n": new Set(),
  "data-i18n-aria": new Set(),
  "data-i18n-placeholder": new Set(),
};

const ATTR_RE = /data-i18n(?:-aria|-placeholder)?="([^"]+)"/g;
const ATTR_NAME_RE = /(data-i18n(?:-aria|-placeholder)?)="([^"]+)"/g;

for (const file of htmlFiles) {
  const content = readFileSync(file, "utf-8");
  let m;
  while ((m = ATTR_NAME_RE.exec(content)) !== null) {
    const attr = m[1];
    const key = m[2];
    if (attr in usedKeys) usedKeys[attr].add(key);
  }
}

const allUsedKeys = new Set([
  ...usedKeys["data-i18n"],
  ...usedKeys["data-i18n-aria"],
  ...usedKeys["data-i18n-placeholder"],
]);

ok(
  `Found ${allUsedKeys.size} unique i18n keys in ${htmlFiles.length} HTML files`,
);
ok(`  data-i18n: ${usedKeys["data-i18n"].size} keys`);
ok(`  data-i18n-aria: ${usedKeys["data-i18n-aria"].size} keys`);
ok(`  data-i18n-placeholder: ${usedKeys["data-i18n-placeholder"].size} keys`);

// Check each used HTML key exists in reference bundle
let brokenRefs = 0;
for (const key of allUsedKeys) {
  if (!refKeys.has(key)) {
    error(`HTML references key not found in ${REFERENCE_LANG}.json: "${key}"`);
    brokenRefs++;
  }
}
if (brokenRefs === 0) ok("All HTML data-i18n* keys exist in JSON bundles");

// ── JS: extract translate("key") calls ───────────────────────────────────────

console.log("\n── JS translate() references ────────────────────────────────");

const jsFiles = await glob(join(ROOT, "src/**/*.js"), {
  ignore: "**/node_modules/**",
});
const jsKeys = new Set();
const JS_TRANSLATE_RE = /translate\(\s*["']([^"']+)["']\s*\)/g;

for (const file of jsFiles) {
  const content = readFileSync(file, "utf-8");
  let m;
  while ((m = JS_TRANSLATE_RE.exec(content)) !== null) {
    jsKeys.add(m[1]);
  }
}

ok(
  `Found ${jsKeys.size} unique translate() keys in ${jsFiles.length} JS files`,
);

// Check JS-used keys exist in JSON
let brokenJsRefs = 0;
for (const key of jsKeys) {
  if (!refKeys.has(key)) {
    error(
      `JS translate() references key not found in ${REFERENCE_LANG}.json: "${key}"`,
    );
    brokenJsRefs++;
  }
}
if (brokenJsRefs === 0) ok("All JS translate() keys exist in JSON bundles");

// Combined set: HTML + JS
const allReferencedKeys = new Set([...allUsedKeys, ...jsKeys]);

// Warn about JSON keys never used in HTML or JS (true orphan keys)
console.log("\n── Orphan keys (not in HTML or JS) ─────────────────────────");
let orphans = 0;
for (const key of refKeys) {
  if (!allReferencedKeys.has(key)) {
    warn(`Orphan key in JSON (not referenced anywhere): "${key}"`);
    orphans++;
  }
}
if (orphans === 0) ok("No orphan keys");

// ── Summary ──────────────────────────────────────────────────────────────────

console.log("\n── Summary ──────────────────────────────────────────────────");
console.log(`  JSON keys (${REFERENCE_LANG}): ${refKeys.size}`);
console.log(`  HTML files scanned: ${htmlFiles.length}`);
console.log(`  JS files scanned:   ${jsFiles.length}`);
console.log(`  HTML keys referenced: ${allUsedKeys.size}`);
console.log(`  JS translate() keys:  ${jsKeys.size}`);
console.log(`  Orphan JSON keys: ${orphans}`);
console.log(`  Errors: ${errors}`);
console.log(`  Warnings: ${warnings}`);

if (errors > 0) {
  console.error(`\n✗ i18n check FAILED — ${errors} error(s)\n`);
  process.exit(1);
} else if (warnings > 0) {
  console.warn(`\n⚠ i18n check PASSED with ${warnings} warning(s)\n`);
} else {
  console.log(`\n✓ i18n check PASSED\n`);
}
