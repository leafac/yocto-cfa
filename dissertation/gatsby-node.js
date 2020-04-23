const fs = require("fs");
const child_process = require("child_process");
const { JSDOM } = require("jsdom");
const prettier = require("prettier");
const GithubSlugger = require("github-slugger");

exports.createPages = async ({ graphql }) => {
  const {
    data: {
      markdownRemark: { html },
    },
  } = await graphql(`
    {
      markdownRemark {
        html
      }
    }
  `);
  fs.writeFileSync("public/yocto-cfa-raw.html", html);
  const dom = new JSDOM(html);
  const document = dom.window.document;
  document
    .querySelector(".title-page")
    .insertAdjacentHTML(
      "beforeend",
      `<p class="draft">${new Date().toISOString()}</p>`
    );
  const tableOfContents = [];
  const references = {};
  const referencesCounter = [];
  const slugger = new GithubSlugger();
  for (const element of document.querySelectorAll("h1, h2, h3, h4, h5, h6")) {
    element.id = slugger.slug(element.textContent);
    if (element.closest("main") !== null) {
      const level = Number(element.tagName[1]);
      referencesCounter.splice(level);
      while (referencesCounter.length < level) referencesCounter.push(0);
      referencesCounter[referencesCounter.length - 1]++;
      const referencesCounterString = referencesCounter.join(".");
      element.insertAdjacentHTML(
        "afterbegin",
        `<span class="heading-counter">${referencesCounterString}</span> `
      );
      element.insertAdjacentHTML(
        "beforeend",
        ` <code class="draft">(#${element.id})</code>`
      );
      references[element.id] = referencesCounterString;
    }
    tableOfContents.push({
      id: element.id,
      section: ["header", "main", "footer"].find(
        (section) => element.closest(section) !== null
      ),
      innerHTML: element.innerHTML,
    });
  }
  for (const element of document.querySelectorAll(`a[href^="#"]`)) {
    const href = element.getAttribute("href");
    let reference = references[href.slice(1)];
    if (reference === undefined) {
      console.error(`Undefined reference: ${href}`);
      reference = "??";
    }
    element.innerHTML = `§ ${reference}`;
  }
  document
    .querySelector(".table-of-contents")
    .insertAdjacentHTML(
      "afterbegin",
      tableOfContents
        .map(
          ({ id, section, innerHTML }) =>
            `<li><a href="#${id}" data-section="${section}">${innerHTML}</a></li>`
        )
        .join("")
    );
  for (const element of document.querySelectorAll(`pre[data-language="css"]`))
    element.outerHTML = `<style>${element.textContent}</style>`;
  fs.writeFileSync(
    "public/yocto-cfa.html",
    prettier.format(dom.serialize(), { parser: "html" })
  );
  child_process.execSync(
    "node_modules/prince/prince/lib/prince/bin/prince --baseurl src/ --pdf-profile PDF/A-1b --no-artificial-fonts --fail-dropped-content --fail-missing-resources --fail-missing-glyphs public/yocto-cfa.html --output yocto-cfa.pdf"
  );
};
