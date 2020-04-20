const { promises: fs } = require("fs");
const Prince = require("prince");

exports.createPages = async ({ graphql }) => {
  const paths = {
    html: "public/yocto-cfa.html",
    pdf: "yocto-cfa.pdf",
  };
  const {
    data: {
      markdownRemark: {
        html,
        frontmatter: { title, ...meta },
      },
    },
  } = await graphql(`
    {
      markdownRemark {
        html
        frontmatter {
          title
          author
          subject
          keywords
        }
      }
    }
  `);
  await fs.writeFile(
    paths.html,
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="../src/styles.css">
  <title>${title}</title>
  ${Object.entries(meta)
    .map(([name, content]) => `<meta name="${name}" content="${content}">`)
    .join("\n")}
</head>
<body>
${html}
</body>
</html>
`
  );
  await new Prince()
    .option("pdf-profile", "PDF/A-1b")
    .inputs(paths.html)
    .output(paths.pdf)
    .execute();
};
