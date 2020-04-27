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
        gatsbyRemarkPlugins: [
          {
            resolve: `gatsby-remark-vscode`,
            options: {
              theme: `Light+ (default light)`,
              injectStyles: false,
            },
          },
        ],
        remarkPlugins: [require("remark-math")],
        rehypePlugins: [
          [
            require("rehype-katex"),
            {
              output: "mathml",
            },
          ],
        ],
      },
    },
    `gatsby-plugin-react-helmet`,
  ],
};
