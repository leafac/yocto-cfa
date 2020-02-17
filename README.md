# Yocto-CFA

**[Leandro Facchinetti](https://www.leafac.com)’s dissertation**

[Dissertation PDF](dissertation/yocto-cfa.pdf)

[Source](https://github.com/leafac/yocto-cfa)

![Main](https://github.com/leafac/yocto-cfa/workflows/Main/badge.svg)

# Build Dissertation

Install [LaTeX](https://www.latex-project.org), [Pygments](http://pygments.org), and the fonts Charter and Menlo (they’re installed by default on macOS). In the `dissertation` folder, run `latexmk`. The dissertation will be at `dissertation/yocto-cfa.pdf`.

The images in the dissertation are composed with [macOS Keynote](https://www.apple.com/keynote/). If you modify them, export from Keynote as a PDF and run `pdfcrop dissertation/images.pdf dissertation/images.pdf`.

# Run Tests

Install [Node.js](https://nodejs.org/). In the `code` folder, run `npm install` followed by `npm test`.
