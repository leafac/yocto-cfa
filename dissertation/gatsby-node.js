const fs = require("fs");
const child_process = require("child_process");
const { JSDOM } = require("jsdom");
const prettier = require("prettier");

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
  const headingsCounter = [];
  for (const element of document.querySelectorAll(
    "main h1, main h2, main h3, main h4, main h5, main h6"
  )) {
    const level = Number(element.tagName[1]);
    headingsCounter.splice(level);
    while (headingsCounter.length < level) headingsCounter.push(0);
    headingsCounter[headingsCounter.length - 1]++;
    const headingsCounterString = headingsCounter.join(".");
    const className = "heading-counter";
    element.insertAdjacentHTML(
      "afterbegin",
      `<span class="${className}" id="${element.id}">${headingsCounterString}</span> `
    );
    document
      .querySelector(`.toc [href="#${element.id}"]`)
      .insertAdjacentHTML(
        "afterbegin",
        `<span class="${className}">${headingsCounterString}</span> `
      );
    element.removeAttribute("id");
  }
  fs.writeFileSync(
    "public/yocto-cfa.html",
    prettier.format(dom.serialize(), { parser: "html" })
  );
  child_process.execSync(
    "node_modules/prince/prince/lib/prince/bin/prince --baseurl src/ --pdf-profile PDF/A-1b --no-artificial-fonts --fail-dropped-content --fail-missing-resources --fail-missing-glyphs public/yocto-cfa.html --output yocto-cfa.pdf"
  );
};
