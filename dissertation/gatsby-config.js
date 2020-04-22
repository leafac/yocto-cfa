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
          gatsbyRemarkPlugins: [
            {
              resolve: `gatsby-remark-vscode`,
              options: {
                theme: "Light+ (default light)",
                injectStyles: false,
              },
            },
          ],
          remarkPlugins: [require("remark-math")],
          rehypePlugins: [require("rehype-katex")],
        },
      },
    },
    `gatsby-plugin-react-helmet`,
  ],
};
