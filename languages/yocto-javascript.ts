import * as esprima from "esprima"
import * as estree from "estree"

export type Expression = ArrowFunctionExpression | CallExpression | Identifier

export interface ArrowFunctionExpression {
  type: "ArrowFunctionExpression"
  params: [Identifier]
  body: Expression
}

export interface CallExpression {
  type: "CallExpression"
  callee: Expression
  arguments: [Expression]
}

export interface Identifier {
  type: "Identifier"
  name: string
}

export type Value = ArrowFunctionExpression

export function YJS(strings: TemplateStringsArray): Expression {
  return (esprima.parseScript(strings[0]).body[0] as estree.ExpressionStatement).expression as Expression
}
