module.exports = {
  plugins: [
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
              theme: `Light+ (default light)`,
              injectStyles: false,
            },
          },
        ],
      },
    },
    `gatsby-plugin-react-helmet`,
  ],
};
