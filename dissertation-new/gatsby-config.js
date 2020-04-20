module.exports = {
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/src/`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      plugins: [
        {
          resolve: `gatsby-remark-vscode`,
          options: {
            theme: "Light+ (default light)",
          },
        },
      ],
    },
  ],
};
