module.exports = {
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/src`,
      },
    },
    {
      resolve: "gatsby-plugin-page-creator",
      options: {
        path: `${__dirname}/src`,
      },
    },
    {
      resolve: `gatsby-plugin-mdx`,
      options: {
        defaultLayouts: {
          default: require.resolve("./src/layout.js"),
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
