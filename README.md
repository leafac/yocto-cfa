[![Build Status](https://travis-ci.com/leafac/demand-driven-context-sensitive-higher-order-program-analysis.svg?branch=master)](https://travis-ci.com/leafac/demand-driven-context-sensitive-higher-order-program-analysis)

Demand-Driven Context-Sensitive Higher-Order Program Analysis
=============================================================

[Leandro Facchinetti](https://www.leafac.com)’s dissertation.

[**The Dissertation**](demand-driven-context-sensitive-higher-order-program-analysis.pdf) · [**The Dissertation Source**](demand-driven-context-sensitive-higher-order-program-analysis.tex)

Build the dissertation with the usual LaTeX routine:

```console
$ lualatex demand-driven-context-sensitive-higher-order-program-analysis.tex
$ bibtex demand-driven-context-sensitive-higher-order-program-analysis
$ lualatex demand-driven-context-sensitive-higher-order-program-analysis.tex
$ lualatex demand-driven-context-sensitive-higher-order-program-analysis.tex
```

Run the tests for the accompanying code with [Racket](https://racket-lang.org):

```console
$ raco test .
```
