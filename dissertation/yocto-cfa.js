const fs = require("fs");
const child_process = require("child_process");
const marked = require("marked");
const { JSDOM } = require("jsdom");
const shiki = require("shiki");
const rangeParser = require("parse-numeric-range");
const renderMathInElement = require("katex/dist/contrib/auto-render");

(async () => {
  const markdown = fs.readFileSync("yocto-cfa.md", "utf8");
  const rawHTML = marked(markdown);
  const dom = new JSDOM(rawHTML);
  await processHTML(dom.window.document);
  const processedHTML = dom.serialize();
  fs.writeFileSync("yocto-cfa.html", processedHTML);
  child_process.execFileSync(
    "node_modules/prince/prince/lib/prince/bin/prince",
    [
      "--pdf-profile=PDF/A-1b",
      "--no-artificial-fonts",
      "--fail-dropped-content",
      "--fail-missing-resources",
      "--fail-missing-glyphs",
      "yocto-cfa.html",
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
    const counterString = counter.join(".");
    element.innerHTML = `<span class="heading-counter">${counterString}</span> ${element.innerHTML}<code class="draft"> (#${element.id})</code>`;
  }

  // Add Table of Contents
  document.querySelector("#table-of-contents").insertAdjacentHTML(
    "afterend",
    [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")]
      .map((header) => {
        const section = ["header", "main", "footer"].find(
          (section) => header.closest(section) !== null
        );
        return `<div class="table-of-contents-item"><a href="#${header.id}" data-section="${section}">${header.innerHTML}</a></div>`;
      })
      .join("")
  );

  // Resolve cross-references
  for (const element of document.querySelectorAll(`main a[href^="#"]`)) {
    const href = element.getAttribute("href");
    const target = document.querySelector(`${href} .heading-counter`);
    if (target === null) console.error(`Undefined cross-reference: ${href}`);
    element.textContent = `§ ${target?.textContent ?? "??"}`;
  }

  // Resolve citations
  const unusedCitations = new Set(
    [...document.querySelectorAll("#bibliography + ol span:first-child")].map(
      (element) => element.id
    )
  );
  for (const element of document.querySelectorAll(`a[href=""]`)) {
    const citations = [];
    for (const segment of element.textContent.split(",")) {
      const [id, ...description] = segment.trim().split(" ");
      const target = document.querySelector(`#${id}`);
      if (target === null) {
        console.error(`Undefined citation: ${id}`);
        citations.push(["??", ...description].join(" "));
        continue;
      }
      unusedCitations.delete(id);
      const listItem = target.parentElement;
      const index = [...listItem.parentElement.children].indexOf(listItem);
      const number = index + 1;
      citations.push(
        `<a href="#${id}">${[number, ...description].join(" ")}</a>`
      );
    }
    element.outerHTML = `[${citations.join(", ")}]`;
  }
  if (unusedCitations.size !== 0)
    console.error(`Unused citations: ${[...unusedCitations].join(", ")}`);

  // Add syntax highlighting
  const highlighter = await shiki.getHighlighter({ theme: "light_plus" });
  for (const element of document.querySelectorAll("code")) {
    let code;
    let language;
    let shouldNumberLines = false;
    let linesToHighlight = [];
    const isBlock = element.parentElement.tagName === "PRE";
    if (isBlock) {
      if (!element.className.startsWith("language-")) continue;
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
      const [languageSegment, ...codeSegments] = element.textContent.split("`");
      if (codeSegments.length === 0) continue;
      code = codeSegments.join("`");
      language = languageSegment;
    }
    let highlightedCode;
    try {
      highlightedCode = highlighter.codeToHtml(code, language);
    } catch (error) {
      console.error(error);
      continue;
    }
    const highlightedLines = JSDOM.fragment(highlightedCode)
      .querySelector("code")
      .innerHTML.split("\n");
    if (shouldNumberLines) {
      const width = String(highlightedLines.length).length;
      for (const [index, line] of Object.entries(highlightedLines)) {
        const lineNumber = String(Number(index) + 1).padStart(width);
        highlightedLines[
          index
        ] = `<span class="line-number">${lineNumber}</span>  ${line}`;
      }
    }
    for (const lineToHighlight of linesToHighlight) {
      const index = lineToHighlight - 1;
      const line = highlightedLines[index];
      if (line === undefined) {
        console.error(
          `Failed to highlight line out of range: ${lineToHighlight}`
        );
        continue;
      }
      highlightedLines[index] = `<div class="highlight-line">${line}</div>`;
    }
    element.innerHTML = highlightedLines.join("\n");
  }

  // Render mathematics
  document.head.insertAdjacentHTML(
    "beforeend",
    `<link rel="stylesheet" href="node_modules/katex/dist/katex.css">`
  );
  global.document = document;
  renderMathInElement(document.body, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$", right: "$", display: false },
    ],
    output: "mathml",
  });

  // Make URLs monospaced
  for (const element of document.querySelectorAll("a"))
    if (element.innerHTML === element.getAttribute("href"))
      element.innerHTML = `<code>${element.innerHTML}</code>`;

  // Remove draft
  if (process.env.NODE_ENV === "production")
    for (const element of document.querySelectorAll(".draft")) element.remove();
}
