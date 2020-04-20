import React from "react";
import { Helmet } from "react-helmet";
import "typeface-pt-serif";
import "typeface-pt-mono";
import "./layout.css";

export default ({
  children,
  pageContext: {
    frontmatter: { title, author, subject, keywords, date },
  },
}) => {
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="author" content={author} />
        <meta name="subject" content={subject} />
        <meta name="keywords" content={keywords} />
        <meta
          name="date"
          content={new Date().toISOString().slice(0, "yyyy-mm-dd".length)}
        />
        <meta name="generator" content="Gatsby & Prince" />
      </Helmet>
      <header>
        <div class="title-page">
          <p class="title">{title}</p>
          <p class="author">
            by
            <br />
            {author}
          </p>
          <p class="statement">
            A dissertation submitted to Johns Hopkins University
            <br />
            in conformity with the requirements for the degree of Doctor of
            Philosophy
          </p>
          <p class="publishing-location">
            Baltimore, Maryland
            <br />
            {date}
          </p>
          <p>{/* TODO */ new Date().toISOString()}</p>
        </div>
      </header>
      {children}
    </>
  );
};
