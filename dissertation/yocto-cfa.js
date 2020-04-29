const fs = require("fs");
const child_process = require("child_process");
const remark = require("remark");
const { JSDOM } = require("jsdom");
const shiki = require("shiki");
const rangeParser = require("parse-numeric-range");

(async () => {
  const markdown = fs.readFileSync("yocto-cfa.md");
  const rawHTML = remark()
    .use(require("remark-slug"))
    .use(require("remark-math"))
    .use(require("remark-html-katex"), {
      output: "mathml",
    })
    .use(require("remark-html"))
    .processSync(markdown).contents;
  fs.writeFileSync("yocto-cfa--raw.html", rawHTML);
  const dom = new JSDOM(rawHTML);
  await processHTML(dom.window.document);
  const processedHTML = dom.serialize();
  fs.writeFileSync("yocto-cfa--processed.html", processedHTML);
  child_process.execFileSync(
    "node_modules/prince/prince/lib/prince/bin/prince",
    [
      "--pdf-profile=PDF/A-1b",
      "--no-artificial-fonts",
      "--fail-dropped-content",
      "--fail-missing-resources",
      "--fail-missing-glyphs",
      "yocto-cfa--processed.html",
      "--output=yocto-cfa.pdf",
    ]
  );
})();

async function processHTML(/** @type {Document} */ document) {
  // Add stylesheet
  document.head.insertAdjacentHTML(
    "beforeend",
    `<link rel="stylesheet" href="yocto-cfa.css">`
  );

  // Add timestamp
  const timestamp = new Date().toISOString();
  document.head.insertAdjacentHTML(
    "beforeend",
    `<meta name="date" content="${timestamp.split("T")[0]}">`
  );
  document
    .querySelector(".title-page")
    .insertAdjacentHTML(
      "beforeend",
      `<div class="timestamp draft">${timestamp}</div>`
    );

  // Add heading counter
  const counter = [];
  for (const element of document.querySelectorAll(
    "main h1, main h2, main h3, main h4, main h5, main h6"
  )) {
    const level = element.tagName[1];
    while (counter.length < level) counter.push(0);
    counter.splice(level);
    counter[level - 1]++;
    element.innerHTML = `<span class="heading-counter">${counter.join(
      "."
    )}</span> ${element.innerHTML}<code class="draft"> (#${element.id})</code>`;
  }

  // Add Table of Contents
  document
    .querySelector("#table-of-contents")
    .insertAdjacentHTML(
      "afterend",
      `<ul>${[...document.querySelectorAll("h1, h2, h3, h4, h5, h6")]
        .map(
          (header) =>
            `<li><a href="#${header.id}" data-section="${[
              "header",
              "main",
              "footer",
            ].find((section) => header.closest(section) !== null)}">${
              header.innerHTML
            }</a></li>`
        )
        .join("")}</ul>`
    );

  // Resolve cross-references
  for (const element of document.querySelectorAll(`main a[href^="#"]`)) {
    const href = element.getAttribute("href");
    const target = document.querySelector(`${href} .heading-counter`);
    if (target === null) console.error(`Undefined reference: ${href}`);
    element.textContent = `§ ${target?.textContent ?? "??"}`;
  }

  // Add syntax highlighting
  const highlighter = await shiki.getHighlighter({ theme: "light_plus" });
  for (const element of document.querySelectorAll("code")) {
    let code;
    let language;
    let shouldNumberLines = false;
    let linesToHighlight = [];
    if (element.className.startsWith("language-")) {
      code = element.textContent;
      const match = element.className.match(
        /^language-(?<language>.*?)(?:\{(?<options>.*?)\})?$/
      );
      language = match.groups.language;
      if (match.groups.options !== undefined)
        for (const option of match.groups.options.split("|"))
          if (option === "number") shouldNumberLines = true;
          else if (option.match(/^[0-9,\-\.]+$/))
            linesToHighlight = rangeParser(option);
          else console.error(`Unrecognized option for code block: ${option}`);
    } else {
      const segments = element.textContent.split("◊");
      if (segments.length === 2) [language, code] = segments;
    }
    if (code === undefined || language === undefined) continue;
    let highlightedCode;
    try {
      highlightedCode = highlighter.codeToHtml(code, language);
    } catch (error) {
      console.error(error);
      continue;
    }
    const highlightedLines = new JSDOM(highlightedCode).window.document
      .querySelector("code")
      .innerHTML.split("\n");
    if (shouldNumberLines)
      for (const [index, line] of Object.entries(highlightedLines))
        highlightedLines[index] = `<span class="line-number">${String(
          Number(index) + 1
        ).padStart(String(highlightedLines.length).length)}</span>  ${line}`;
    for (const lineToHighlight of linesToHighlight) {
      const index = lineToHighlight - 1;
      const line = highlightedLines[index];
      highlightedLines[index] = `<div class="highlight-line">${line}</div>`;
    }
    element.innerHTML = highlightedLines.join("\n");
  }

  // Remove draft
  if (process.env.NODE_ENV === "production")
    for (const element of document.querySelectorAll(".draft")) element.remove();
}
