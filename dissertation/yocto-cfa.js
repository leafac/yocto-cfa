const fs = require("fs");
const child_process = require("child_process");
const remark = require("remark");
const { JSDOM } = require("jsdom");
const shiki = require("shiki");

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
    if (target === null) console.error(`Undefined reference ${href}`);
    element.textContent = `§ ${target?.textContent ?? "??"}`;
  }

  // Add syntax highlighting
  for (const element of document.querySelectorAll("pre")) {
    const language = element
      .querySelector(`[class^="language-"]`)
      ?.className?.slice("language-".length);
    if (language === null) continue;
    const highlightedCode = await highlight(element.textContent, language);
    if (highlightedCode === null) continue;
    element.outerHTML = highlightedCode.outerHTML;
  }
  for (const element of document.querySelectorAll("code")) {
    if (element.parentElement.tagName === "pre") continue;
    const segments = element.textContent.split("◊");
    if (segments.length !== 2) continue;
    const [language, code] = segments;
    const highlightedCode = await highlight(code, language);
    if (highlightedCode === null) continue;
    element.outerHTML = highlightedCode.querySelector("code").outerHTML;
  }

  // Remove draft
  if (process.env.NODE_ENV === "production")
    for (const element of document.querySelectorAll(".draft")) element.remove();
}

async function highlight(code, language) {
  try {
    return new JSDOM(
      (await shiki.getHighlighter({ theme: "light_plus" })).codeToHtml(
        code,
        language
      )
    ).window.document.querySelector("pre");
  } catch (error) {
    console.error(error);
    return null;
  }
}
