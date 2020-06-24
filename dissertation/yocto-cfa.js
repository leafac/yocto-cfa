const fs = require("fs");
const child_process = require("child_process");
const remark = require("remark");
const remarkHTML = require("remark-html");
const { JSDOM } = require("jsdom");
const mathJax = require("mathjax-node");
const shiki = require("shiki");
const rangeParser = require("parse-numeric-range");
const GitHubSlugger = require("github-slugger");

(async () => {
  // Render Markdown
  const markdown = fs.readFileSync("yocto-cfa.md", "utf8");
  const html = remark()
    .use({
      settings: { commonmark: true },
    })
    .use(remarkHTML)
    .processSync(markdown).contents;
  const dom = new JSDOM(html);
  const document = dom.window.document;

  // Add non-content head material
  document.head.insertAdjacentHTML(
    "afterbegin",
    `
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="yocto-cfa.css">
    `
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

  // Render mathematics
  mathJax.config({
    MathJax: {
      SVG: { blacker: 0 },
    },
  });
  for (const element of document.querySelectorAll("pre > code.language-math")) {
    const renderedMath = (
      await mathJax.typeset({
        math: element.textContent,
        svg: true,
      })
    ).svg;
    element.parentElement.outerHTML = `<figure>${renderedMath}</figure>`;
  }
  for (const element of [
    ...document.querySelectorAll(":not(pre) > code"),
  ].filter((element) => element.textContent.startsWith("math`")))
    element.outerHTML = (
      await mathJax.typeset({
        math: element.textContent.slice("math`".length),
        svg: true,
      })
    ).svg;

  // Add syntax highlighting
  const highlighter = await shiki.getHighlighter({ theme: "light_plus" });
  for (const element of document.querySelectorAll(
    `pre > code[class^="language-"]`
  )) {
    const { language, options } = element.className.match(
      /^language-(?<language>[a-z]+)(?<options>.*)$/
    ).groups;
    const code = element.textContent;
    let shouldNumberLines = false;
    let linesToHighlight = [];
    for (const option of options.match(/(?<=\{).*?(?=\})/g) ?? [])
      if (option === "number") shouldNumberLines = true;
      else if (option.match(/^[0-9,\-\.]+$/))
        linesToHighlight = rangeParser(option);
      else console.error(`Unrecognized option for code block: ${option}`);
    let highlightedText;
    try {
      highlightedText = highlighter.codeToHtml(code, language);
    } catch (error) {
      console.error(error);
      continue;
    }
    const highlightedCode = JSDOM.fragment(highlightedText).querySelector(
      "code"
    );
    const listing = JSDOM.fragment(
      `
        <table class="listing">
          ${highlightedCode.innerHTML
            .split("\n")
            .map((line) => `<tr><td><pre><code>${line}</code></pre></td></tr>`)
            .join("\n")}
        </table>
    `
    ).querySelector("table");
    const lines = listing.querySelectorAll("tr");
    if (shouldNumberLines)
      for (const [index, line] of Object.entries(lines)) {
        const lineNumber = Number(index) + 1;
        line.insertAdjacentHTML(
          "afterbegin",
          `<td class="line-number"><pre><code>${lineNumber}</code></pre></td>`
        );
      }
    for (const lineToHighlight of linesToHighlight) {
      const line = lines[lineToHighlight - 1];
      if (line === undefined) {
        console.error(
          `Failed to highlight line out of range: ${lineToHighlight}`
        );
        continue;
      }
      line.classList.add("highlighted-line");
    }
    element.parentElement.outerHTML = listing.outerHTML;
  }
  for (const element of [
    ...document.querySelectorAll(":not(pre) > code"),
  ].filter((element) => element.textContent.match(/^[a-z]+`/))) {
    const { language, code } = element.textContent.match(
      /^(?<language>[a-z]+)`(?<code>.*)$/
    ).groups;
    let highlightedText;
    try {
      highlightedText = highlighter.codeToHtml(code, language);
    } catch (error) {
      console.error(error);
      continue;
    }
    const highlightedCode = JSDOM.fragment(highlightedText).querySelector(
      "code"
    );
    element.innerHTML = highlightedCode.innerHTML;
  }

  // Inline SVGs
  for (const element of document.querySelectorAll(`img[src$=".svg"]`)) {
    const src = element.getAttribute("src");
    if (!fs.existsSync(src)) {
      console.error(`Image not found: ${src}`);
      continue;
    }
    const svg = JSDOM.fragment(fs.readFileSync(src, "utf8")).querySelector(
      "svg"
    );
    for (const elementToHighlight of svg.querySelectorAll("a")) {
      const language = elementToHighlight.getAttribute("xlink:href");
      for (const text of elementToHighlight.querySelectorAll("text")) {
        const code = text.textContent;
        let highlightedText;
        try {
          highlightedText = highlighter.codeToHtml(code, language);
        } catch (error) {
          console.error(error);
          continue;
        }
        const highlightedCode = JSDOM.fragment(highlightedText).querySelector(
          "code"
        );
        for (const span of highlightedCode.querySelectorAll("span")) {
          const style = span.getAttribute("style").replace(/color:/g, "fill:");
          span.outerHTML = `<tspan style="${style}">${span.innerHTML}</tspan>`;
        }
        text.innerHTML = highlightedCode.innerHTML;
      }
      elementToHighlight.outerHTML = elementToHighlight.innerHTML;
    }
    element.outerHTML = svg.outerHTML;
  }

  // Make URLs monospaced
  for (const element of document.querySelectorAll("a"))
    if (element.innerHTML === element.getAttribute("href"))
      element.innerHTML = `<code>${element.innerHTML}</code>`;

  // Slugify headings
  const slugger = new GitHubSlugger();
  for (const element of document.querySelectorAll("h1, h2, h3, h4, h5, h6"))
    element.id = slugger.slug(element.textContent);

  // Add heading counters
  const counter = [];
  for (const element of document.querySelectorAll(
    "main h1, main h2, main h3, main h4, main h5, main h6"
  )) {
    const level = element.tagName[1];
    while (counter.length < level) counter.push(0);
    counter.splice(level);
    counter[level - 1]++;
    const counterString = counter.join(".");
    element.insertAdjacentHTML(
      "afterbegin",
      `<span class="heading-counter">${counterString}</span> `
    );
  }

  // Add Table of Contents
  document.querySelector("#table-of-contents").insertAdjacentHTML(
    "afterend",
    [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")]
      .filter((header) => header.textContent !== "Table of Contents")
      .map((header) => {
        const section = ["header", "main", "footer"].find(
          (section) => header.closest(section) !== null
        );
        return `<div class="table-of-contents-item"><a href="#${header.id}" data-section="${section}">${header.innerHTML}</a></div>`;
      })
      .join("")
  );

  // Add heading identifiers
  for (const element of document.querySelectorAll(
    "main h1, main h2, main h3, main h4, main h5, main h6"
  ))
    element.insertAdjacentHTML(
      "beforeend",
      `<code class="draft"> [](#${element.id})</code>`
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
    [
      ...document.querySelectorAll(
        "#bibliography + ol > li > span:first-child"
      ),
    ].map((element) => element.id)
  );
  for (const element of document.querySelectorAll(`a[href=""]`)) {
    const citations = [];
    for (const segment of element.textContent.split(",")) {
      const { id, description } = segment
        .trim()
        .match(/^(?<id>[^ ]+)(?<description>.*)?$/).groups;
      const target = document.querySelector(`#${id}`);
      if (target === null) {
        console.error(`Undefined citation: ${id}`);
        citations.push(`??${description ?? ""}`);
        continue;
      }
      unusedCitations.delete(id);
      const listItem = target.parentElement;
      const index = [...listItem.parentElement.children].indexOf(listItem);
      const number = index + 1;
      citations.push(`<a href="#${id}">${number}${description ?? ""}</a>`);
    }
    element.outerHTML = `[${citations.join(", ")}]`;
  }
  if (unusedCitations.size !== 0)
    console.error(`Unused citations: ${[...unusedCitations].join(", ")}`);

  // Add ‘legend’ wrapper for styling
  for (const element of document.querySelectorAll("legend"))
    element.innerHTML = `<span class="legend-wrapper">${element.innerHTML}</span>`;

  // Remove draft
  if (process.env.NODE_ENV === "production")
    for (const element of document.querySelectorAll(".draft")) element.remove();

  // Render PDF
  fs.writeFileSync("yocto-cfa.html", dom.serialize());
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
