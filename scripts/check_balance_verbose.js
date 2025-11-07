const fs = require("fs");
const path = require("path");
const file = path.resolve(__dirname, "..", "src", "app", "geree", "page.tsx");
const text = fs.readFileSync(file, "utf8");
let stack = [];
const pairs = { "{": "}", "(": ")", "[": "]" };
const opening = new Set(Object.keys(pairs));
const closing = new Set(Object.values(pairs));
let line = 1,
  col = 0;
for (let i = 0; i < text.length; i++) {
  const ch = text[i];
  if (ch === "\n") {
    line++;
    col = 0;
    continue;
  }
  col++;
  if (opening.has(ch)) {
    stack.push({ ch, line, col, idx: i });
  } else if (closing.has(ch)) {
    const last = stack[stack.length - 1];
    if (!last) {
      console.error(`Unmatched closing '${ch}' at ${line}:${col}`);
      printContext(i);
      process.exit(2);
    }
    const expected = pairs[last.ch];
    if (ch === expected) {
      stack.pop();
    } else {
      console.error(
        `Mismatched closing at ${line}:${col} - expected '${expected}' to match '${last.ch}' opened at ${last.line}:${last.col}', but found '${ch}'`
      );
      printContext(i);
      process.exit(3);
    }
  }
}
if (stack.length) {
  const last = stack[stack.length - 1];
  console.error(`Unclosed '${last.ch}' opened at ${last.line}:${last.col}`);
  printContext(last.idx);
  process.exit(4);
}
console.log("All brackets/parens/braces are balanced.");
process.exit(0);

function printContext(idx) {
  const start = Math.max(0, idx - 120);
  const end = Math.min(text.length, idx + 120);
  const slice = text.slice(start, end);
  const before = text.slice(Math.max(0, idx - 300), idx);
  const after = text.slice(idx, Math.min(text.length, idx + 300));
  console.log("--- surrounding ---");
  console.log(slice.replace(/\n/g, "\\n"));
}
