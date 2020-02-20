# Yocto-CFA

**[Leandro Facchinetti](https://www.leafac.com)’s dissertation**

[Dissertation PDF](dissertation/yocto-cfa.pdf)

[Source](https://github.com/leafac/yocto-cfa)

![Main](https://github.com/leafac/yocto-cfa/workflows/Main/badge.svg)

# Build Dissertation

Install [LaTeX](https://www.latex-project.org), [Pygments](http://pygments.org), and the fonts Palatino and Courier New (they’re installed by default in macOS). In the `dissertation` folder, run `latexmk`. The dissertation will be at `dissertation/yocto-cfa.pdf`.

The images in the dissertation are drawn with [macOS Keynote](https://www.apple.com/keynote/). After modifying them, export as a PDF called `dissertation/images.pdf` and, in the `dissertation` folder, run `pdfcrop dissertation/images.pdf dissertation/images.pdf`.

# Run Tests

Install [Node.js](https://nodejs.org/). In the `code` folder, run `npm install` followed by `npm test`.
