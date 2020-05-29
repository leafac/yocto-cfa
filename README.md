<h1 align="center">Yocto-CFA</h1>
<h3 align="center"><a href="https://www.leafac.com">Leandro Facchinetti</a>’s dissertation</h3>
<p align="center">
<a href="https://github.com/leafac/yocto-cfa"><img alt="Source" src="https://img.shields.io/badge/Source---"></a>
<a href="dissertation/yocto-cfa.pdf"><img alt="PDF" src="https://img.shields.io/badge/PDF---"></a>
<a href="https://github.com/leafac/yocto-cfa/actions"><img alt="Continuous Integration" src="https://github.com/leafac/yocto-cfa/workflows/.github/workflows/main.yml/badge.svg"></a>
</p>

Install [Node.js](https://nodejs.org/).

## Build Dissertation

```console
$ (cd dissertation && npm install-test)
```

## Run Code Tests

```console
$ (cd code && npm install-test)
```

## Experiment with Code

```console
$ (cd code && npm install && npx ts-node)

// For example
> import { evaluate } from "./developing-an-analyzer/step-0--substitution-based-interpreter"
> evaluate(`(y => y)(x => x)`)
'x => x'
```
