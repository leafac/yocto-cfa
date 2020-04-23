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
  fs.writeFileSync("public/yocto-cfa.html", html);
  child_process.execSync(
    "node_modules/prince/prince/lib/prince/bin/prince --baseurl src/ --pdf-profile PDF/A-1b --no-artificial-fonts --fail-dropped-content --fail-missing-resources --fail-missing-glyphs public/yocto-cfa.html --output yocto-cfa.pdf"
  );
};
