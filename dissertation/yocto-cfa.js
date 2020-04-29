const fs = require("fs");
const child_process = require("child_process");
const remark = require("remark");
const { JSDOM } = require("jsdom");

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

  // Number headings
  const counter = [];
  document
    .querySelectorAll("main h1, main h2, main h3, main h4, main h5, main h6")
    .forEach((element) => {
      const level = element.tagName[1];
      while (counter.length < level) counter.push(0);
      counter.splice(level);
      counter[level - 1]++;
      element.innerHTML = `<span class="heading-number">${counter.join(
        "."
      )}</span> ${element.innerHTML}<code class="draft"> (#${
        element.id
      })</code>`;
    });

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
  document.querySelectorAll(`main a[href^="#"]`).forEach((element) => {
    const href = element.getAttribute("href");
    const target = document.querySelector(`${href} .heading-number`);
    if (target === null) console.error(`Undefined reference ${href}`);
    element.textContent = `§ ${target?.textContent ?? "??"}`;
  });

  // Remove draft
  if (process.env.NODE_ENV === "production")
    document.querySelectorAll(".draft").forEach((element) => element.remove());
}
