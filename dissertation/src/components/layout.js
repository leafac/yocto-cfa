import React from "react";
import { Helmet } from "react-helmet";
import "typeface-pt-serif";
import "typeface-pt-mono";
import "katex/dist/katex.css";
import "./layout.css";

export default ({
  children,
  pageContext: {
    frontmatter: { title, author, subject, keywords, language },
  },
}) => (
  <>
    <Helmet>
      <html lang={language} />
      <title>{title}</title>
      <meta name="author" content={author} />
      <meta name="subject" content={subject} />
      <meta name="keywords" content={keywords} />
      <meta name="date" content={new Date().toISOString().split("T")[0]} />
    </Helmet>
    {children}
  </>
);
