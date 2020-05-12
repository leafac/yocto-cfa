<h1 align="center">Yocto-CFA</h1>
<h3 align="center"><a href="https://www.leafac.com">Leandro Facchinetti</a>’s dissertation</h3>
<p align="center">
<a href="https://github.com/leafac/yocto-cfa"><img alt="Source" src="https://img.shields.io/badge/Source---"></a>
<a href="dissertation/yocto-cfa.pdf"><img alt="PDF" src="https://img.shields.io/badge/PDF---"></a>
<a href="https://github.com/leafac/yocto-cfa/actions"><img alt="Continuous Integration" src="https://github.com/leafac/yocto-cfa/workflows/.github/workflows/main.yml/badge.svg"></a>
</p>

## Dissertation

### Build

Install [Node.js](https://nodejs.org/) and run:

```console
$ (cd dissertation && npm install-test)
```

### Edit Images

1. Use [macOS Keynote](https://www.apple.com/keynote/) to edit `dissertation/images/images.key`.
2. Change the master slide to remove the background.
3. Export to a PDF.
4. Use [Inkscape](https://inkscape.org) to produce SVGs from the PDF:

   ```console
   $ (cd dissertation/images && (for page in {1..<NUMBER-OF-PAGES-ON-THE-PDF>}; do inkscape --export-plain-svg --export-area-drawing  --pdf-page=$page --export-filename=$page.svg images.pdf; done) && npx svgo --enable=prefixIds *.svg)
   ```

## Code

### Run Tests

Install [Node.js](https://nodejs.org/) and run:

```console
$ (cd code && npm install-test)
```

### Experiment

```console
$ (cd code && npm install && npx ts-node)

// For example
> import { evaluate } from "./developing-an-analyzer/step-0--substitution-based-interpreter"
> evaluate(`(y => y)(x => x)`)
'x => x'
```
