module.exports = {
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/src`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-autolink-headers`,
            options: {
              icon: false,
            },
          },
          {
            resolve: `gatsby-remark-table-of-contents`,
            options: {
              exclude: "Table of Contents",
              fromHeading: 1,
            },
          },
          {
            resolve: `gatsby-remark-vscode`,
            options: {
              theme: "Light+ (default light)",
              injectStyles: false,
            },
          },
          `gatsby-remark-katex`,
        ],
      },
    },
  ],
};
