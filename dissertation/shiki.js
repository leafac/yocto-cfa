#!/usr/bin/env node
// TODO: Get rid of async/await
// TODO: Destruct process.argv
(async function() {
  const fs = require("fs");
  const shiki = require("shiki");

  // fs.appendFileSync("debug.json", JSON.stringify(process.argv, null, 2));
  if (process.argv[2] === "-S") process.exit(0);

  const input = fs.readFileSync(process.argv[12], "utf-8");
  const highlighter = await shiki.getHighlighter({ theme: "light_plus" });
  const tokens = highlighter.codeToThemedTokens(input, process.argv[3]);
  const latex = tokens
    .map(line =>
      line
        .map(
          ({ content, color }) =>
            `\\textcolor[HTML]{${color.slice(1)}}{${content
              .replace(/\\/g, "\\\\")
              .replace(/\{/g, "\\{")
              .replace(/\}/, "\\}")}}`
        )
        .join("")
    )
    .join("\n");

  fs.writeFileSync(
    process.argv[11],
    `\\begin{Verbatim}[commandchars=\\\\\\\{\\\}]\n${latex}\\end{Verbatim}\n`
  );
})();
