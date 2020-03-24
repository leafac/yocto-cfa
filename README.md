<h1 align="center">Yocto-CFA</h1>
<h3 align="center"><a href="https://www.leafac.com">Leandro Facchinetti</a>’s dissertation</h3>
<p align="center">
<a href="https://github.com/leafac/yocto-cfa"><img alt="Source" src="https://img.shields.io/badge/Source---" /></a>
<a href="dissertation/yocto-cfa.pdf"><img alt="PDF" src="https://img.shields.io/badge/PDF---" /></a>
<a href="https://github.com/leafac/yocto-cfa/actions"><img alt="Continuous Integration" src="https://github.com/leafac/yocto-cfa/workflows/.github/workflows/main.yml/badge.svg" /></a>
</p>

# Code

## Run Tests

Install [Node.js](https://nodejs.org/) and run:

```console
$ (cd code && npm install-test)
```

# Dissertation

## Build

**Note:** You must use macOS to build the LaTeX document because it uses system fonts.

Install [LaTeX](https://www.latex-project.org) and [Node.js](https://nodejs.org/), and run:

```console
$ (cd dissertation && npm install && latexmk)
```

You may find the generated PDF at [`dissertation/yocto-cfa.pdf`](dissertation/yocto-cfa.pdf).

## Edit Images

The images in the dissertation are drawn with [Keynote](https://www.apple.com/keynote/) on macOS. Edit them, export as a PDF called `dissertation/images.pdf`, and run:

```console
$ (cd dissertation && pdfcrop images.pdf images.pdf)
```

Then build the dissertation again (see [§ Build](#build)).
