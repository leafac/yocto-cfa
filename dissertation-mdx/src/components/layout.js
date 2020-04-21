import React from "react";
import { Helmet } from "react-helmet";
import "typeface-pt-serif";
import "typeface-pt-mono";
import "./layout.css";

export default ({
  pageContext: {
    frontmatter: { title, author, subject, keywords },
  },
  children,
}) => (
  <>
    <Helmet>
      <html lang="en" />
      <title>{title}</title>
      {Object.entries({ author, subject, keywords }).map(([name, content]) => (
        <meta key={name} name={name} content={content} />
      ))}
    </Helmet>
    {children}
  </>
);
