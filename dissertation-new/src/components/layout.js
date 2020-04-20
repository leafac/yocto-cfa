import React from "react";
import { Helmet } from "react-helmet";
import "typeface-pt-serif";
import "typeface-pt-mono";
import "./layout.css";

export default ({
  children,
  pageContext: {
    frontmatter: { title, ...meta },
  },
}) => {
  return (
    <>
      <Helmet>
        <title>{title}</title>
        {Object.entries(meta).map(([name, content]) => (
          <meta key={name} name={name} content={content} />
        ))}
      </Helmet>
      {children}
    </>
  );
};
