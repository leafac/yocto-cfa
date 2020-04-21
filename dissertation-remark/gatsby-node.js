const fs = require("fs");
const child_process = require("child_process");

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
  fs.writeFileSync(
    "public/yocto-cfa.html",
    `<!DOCTYPE html><html lang="en">${html}</html>`
  );
  child_process.execFileSync(
    `node_modules/prince/prince/lib/prince/bin/prince`,
    [
      "--pdf-profile=PDF/A-1b",
      "--baseurl=src/",
      "public/yocto-cfa.html",
      "--output=yocto-cfa.pdf",
    ]
  );
};
