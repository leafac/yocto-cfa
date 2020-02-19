# Yocto-CFA

**[Leandro Facchinetti](https://www.leafac.com)’s dissertation**

[Dissertation PDF](dissertation/yocto-cfa.pdf)

[Source](https://github.com/leafac/yocto-cfa)

![Main](https://github.com/leafac/yocto-cfa/workflows/Main/badge.svg)

# Build Dissertation

Install [LaTeX](https://www.latex-project.org) and [Pygments](http://pygments.org). In the `dissertation` folder, run `latexmk`. The dissertation will be at `dissertation/yocto-cfa.pdf`.

The images in the dissertation are drawn with [macOS Keynote](https://www.apple.com/keynote/). After modifying them, export as a PDF called `dissertation/images.pdf` and run the following in the `dissertation` folder:

```console
$ pdfcrop images.pdf images.pdf
$ gs -sDEVICE=pdfwrite -dNoOutputFonts -o images-pdfa.pdf images.pdf
```

# Run Tests

Install [Node.js](https://nodejs.org/). In the `code` folder, run `npm install` followed by `npm test`.
