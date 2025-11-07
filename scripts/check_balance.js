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
      process.exit(2);
    }
    const expected = pairs[last.ch];
    if (ch === expected) {
      stack.pop();
    } else {
      console.error(
        `Mismatched closing at ${line}:${col} - expected '${expected}' to match '${last.ch}' opened at ${last.line}:${last.col}', but found '${ch}'`
      );
      process.exit(3);
    }
  }
}
if (stack.length) {
  const last = stack[stack.length - 1];
  console.error(`Unclosed '${last.ch}' opened at ${last.line}:${last.col}`);
  process.exit(4);
}
console.log("All brackets/parens/braces are balanced.");
process.exit(0);
