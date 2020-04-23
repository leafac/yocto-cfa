<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="author" content="Leandro Facchinetti">
<meta name="subject" content="TODO">
<meta name="keywords" content="TODO, TODO, ...">
<title>Yocto-CFA</title>
</head>
<body>
<header>
<div class="title-page">
<p class="title">Yocto-CFA</p>
<p class="author">by<br>Leandro Facchinetti</p>
<p class="statement">A dissertation submitted to Johns Hopkins University<br>in conformity with the requirements for the degree of Doctor of Philosophy</p>
<p class="publishing-location">Baltimore, Maryland<br>August 2020</p>
</div>

<!--
# Abstract

<p>TODO</p>

- **Primary Reader and Advisor:** Dr. Scott Fraser Smith.
- **Readers:** Dr. Zachary Eli Palmer and Dr. Matthew Daniel Green.
-->

# Table of Contents

<ul class="table-of-contents"></ul>

</header>

<main>

# Chapter 123

Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, [](#section-11) when [](#undefined) an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.

## Section 1.1

Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.

### Subsection 1.1.1

### Subsection 1.1.2

## Section 1.2

### Subsection 1.2.1

### Subsection 1.2.2

# Chapter 2

## Section 2.1

### Subsection 2.1.1

### Subsection 2.1.2

## Section 2.2

### Subsection 2.2.1

### Subsection 2.2.2

```js
const config = {
  resolve: `gatsby-source-filesystem`, // highlight-line
  options: {
    path: `${__dirname}/src`,
  },
};
```

</main>

<footer>

# Bibliography

# Biographical Statement

</footer>

```css
@import "../node_modules/typeface-pt-serif/index.css";
@import "../node_modules/typeface-pt-mono/index.css";
@import "../node_modules/katex/dist/katex.css";

@page {
  size: US-Letter;
  margin: 1in 1in 1in 1.5in;
  font: 10pt/1 "PT Serif", prince-no-fallback;
  @bottom {
    content: counter(page);
  }
}

header,
main {
  counter-reset: page 1;
}

header {
  page: header;
}

@page header {
  @bottom {
    content: counter(page, lower-roman);
  }
}

.title-page {
  page: title-page;
}

@page title-page {
  @bottom {
    content: normal;
  }
}

body {
  font: 12pt/2 "PT Serif", prince-no-fallback;
  text-align: justify;
  hyphens: auto;
}

a {
  text-decoration: none;
  color: black;
}

code {
  font-family: "PT Mono", prince-no-fallback;
}

p + p {
  margin-top: -1.12em;
  text-indent: 2em;
}

h1,
h2,
h3 {
  line-height: 1.3;
}

h1 {
  break-before: page;
}

h2,
h3 {
  margin-top: 2em;
}

.heading-counter {
  margin-right: 0.5em;
}

.draft {
  font-size: 10pt;
  color: #bbb;
  /* TODO: display: none; */
}

pre {
  font-size: 10pt;
  line-height: 1.2;
  white-space: pre-wrap;
}

.grvsc-line {
  display: block;
}

.grvsc-line-highlighted {
  background-color: #e0ffff;
}

ul {
  list-style-type: disc;
}

.title-page {
  line-height: 1.2;
  text-align: center;
}

.title-page p {
  margin: 0;
  text-indent: 0;
}

.title-page .title {
  margin-top: 1.5in;
  text-transform: uppercase;
  font-weight: bold;
  letter-spacing: 2pt;
}

.title-page .author {
  margin-top: 1in;
}

.title-page .statement {
  margin-top: 1.5in;
}

.title-page .publishing-location {
  margin-top: 0.5in;
}

.table-of-contents {
  list-style-type: none;
  margin: 0;
}

.table-of-contents a::after {
  content: leader(".  ") target-counter(attr(href), page);
}

.table-of-contents a[data-section="header"]::after {
  content: leader(".  ") target-counter(attr(href), page, lower-roman);
}
```

</body>
</html>
