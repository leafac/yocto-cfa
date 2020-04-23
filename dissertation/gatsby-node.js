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
  for (const element of document.querySelectorAll("script")) {
    eval(fs.readFileSync(`src/${element.getAttribute("src")}`, "utf8"));
    element.remove();
  }
  fs.writeFileSync(
    "public/yocto-cfa.html",
    prettier.format(dom.serialize(), { parser: "html" })
  );
  child_process.execSync(
    "node_modules/prince/prince/lib/prince/bin/prince --baseurl src/ --pdf-profile PDF/A-1b --no-artificial-fonts --fail-dropped-content --fail-missing-resources --fail-missing-glyphs public/yocto-cfa.html --output yocto-cfa.pdf"
  );
};
