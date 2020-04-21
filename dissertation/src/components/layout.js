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
      <meta name="author" content={author} />
      <meta name="subject" content={subject} />
      <meta name="keywords" content={keywords} />
    </Helmet>
    {children}
  </>
);
