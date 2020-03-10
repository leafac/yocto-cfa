#!/usr/bin/env node
(async function() {
  const fs = require("fs");
  const shiki = require("shiki");

  // fs.appendFileSync("debug.json", JSON.stringify(process.argv, null, 2));
  const [
    _node,
    _shiki,
    _l,
    language,
    _f,
    _latex,
    _P,
    _commandprefix,
    _F,
    _tokenmerge,
    _o,
    outputPath,
    inputPath
  ] = process.argv;
  if (_l !== "-l") process.exit(0);

  const input = fs.readFileSync(inputPath, "utf-8");
  const highlighter = await shiki.getHighlighter({ theme: "light_plus" });
  const tokens = highlighter.codeToThemedTokens(input, language);
  // fs.appendFileSync("debug.json", JSON.stringify(tokens, null, 2));
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
    outputPath,
    `\\begin{Verbatim}[commandchars=\\\\\\\{\\\}]\n${latex}\\end{Verbatim}\n`
  );
})();
