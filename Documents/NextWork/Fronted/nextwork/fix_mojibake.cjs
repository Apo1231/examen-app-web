const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "src");
const exts = new Set([".js", ".jsx", ".css", ".html"]);

const replacements = [
  ["\u00c2\u00bf", "¿"],
  ["\u00c2\u00a1", "¡"],
  ["\u00c3\u00a1", "á"],
  ["\u00c3\u00a9", "é"],
  ["\u00c3\u00ad", "í"],
  ["\u00c3\u00b3", "ó"],
  ["\u00c3\u00ba", "ú"],
  ["\u00c3\u0081", "Á"],
  ["\u00c3\u0089", "É"],
  ["\u00c3\u008d", "Í"],
  ["\u00c3\u0093", "Ó"],
  ["\u00c3\u009a", "Ú"],
  ["\u00c3\u00b1", "ñ"],
  ["\u00c3\u0091", "Ñ"],
  ["\u00e2\u0086\u0090", "←"],
  ["\u00e2\u0080\u0093", "–"],
  ["\u00e2\u0080\u0094", "—"],
  ["\u00e2\u0080\u0099", "’"],
  ["\u00e2\u0080\u009c", "“"],
  ["\u00e2\u0080\u009d", "”"],
  ["\u00e2\u0080\u00a6", "…"],
  ["\u00f0\u009f\u0093\u0085", "📅"],
  ["\u00f0\u009f\u0091\u00a8\u00e2\u0080\u008d\u00f0\u009f\u008f\u00ab", "👨‍🏫"],
  ["\u00f0\u009f\u008e\u00af", "🎯"],
];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      walk(full);
      continue;
    }
    if (!exts.has(path.extname(full))) continue;

    let text = fs.readFileSync(full, "utf8");
    const original = text;
    for (const [from, to] of replacements) {
      text = text.split(from).join(to);
    }
    if (text !== original) {
      fs.writeFileSync(full, text, "utf8");
    }
  }
}

walk(root);
