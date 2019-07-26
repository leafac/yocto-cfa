import * as esprima from "esprima"
import * as estree from "estree"

export type Expression = ArrowFunctionExpression | CallExpression | Identifier
export type Value = ArrowFunctionExpression

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
  name: IdentifierName
}

export type IdentifierName = string

export function YJS(strings: TemplateStringsArray): Expression {
  return traverse(esprima.parseScript(strings[0]), new Set())

  function traverse(node: estree.Node, scope: Set<IdentifierName>): Expression {
    switch (node.type) {
      case "Program":
        if (node.body.length !== 1) {
          throw new SyntaxError("A Program must include exactly one Statement")
        }
        return traverse(node.body[0], scope)
      case "ExpressionStatement": return traverse(node.expression, scope)
      case "ArrowFunctionExpression":
        if (node.params.length !== 1) {
          throw new SyntaxError("An ArrowFunctionExpression must include exactly one param")
        }
        const param = node.params[0]
        if (param.type !== "Identifier") {
          throw new SyntaxError("The param in an ArrowFunctionExpression must be an Identifier")
        }
        return {
          type: "ArrowFunctionExpression",
          params: [{ type: "Identifier", name: param.name }],
          body: traverse(node.body, new Set([...scope, param.name]))
        }
      case "CallExpression":
        if (node.arguments.length !== 1) {
          throw new SyntaxError("A CallExpression must include exactly one argument")
        }
        return {
          type: "CallExpression",
          callee: traverse(node.callee, scope),
          arguments: [traverse(node.arguments[0], scope)]
        }
      case "Identifier":
        if (!scope.has(node.name)) {
          throw new SyntaxError(`The Identifier ‘${node.name}’ isn’t in scope`)
        }
        return {
          type: "Identifier",
          name: node.name
        }
      default: throw new SyntaxError(`Unrecognized node of type ‘${node.type}’`)
    }
  }
}
