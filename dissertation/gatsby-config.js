module.exports = {
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/src/pages`,
      },
    },
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
        defaultLayouts: {
          default: require.resolve("./src/components/layout.js"),
        },
        gatsbyRemarkPlugins: [
          {
            resolve: `gatsby-remark-vscode`,
            options: {
              theme: "Light+ (default light)",
              injectStyles: false,
            },
          },
        ],
        remarkPlugins: [
          require("remark-slug"),
          () => (tree) => {
            const toc = require("mdast-util-toc");
            const visit = require("unist-util-visit");
            const tableOfContents = toc(tree, { tight: true }).map;
            if (tableOfContents === null) return;
            visit(
              tree,
              (node) =>
                node.type === "heading" &&
                node.children[0].value === "Table of Contents",
              (node, index, parent) => {
                parent.children.splice(index + 1, 0, tableOfContents);
              }
            );
          },
          require("remark-math"),
        ],
        rehypePlugins: [require("rehype-katex")],
      },
    },
    `gatsby-plugin-react-helmet`,
  ],
};
