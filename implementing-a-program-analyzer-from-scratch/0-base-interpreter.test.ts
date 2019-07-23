import * as esprima from "esprima"
import * as estree from "estree"
import * as _ from "lodash"

///////////////////////////////////////////////////////////////////////////////
// YOCTO-JAVASCRIPT

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

export function YoctoJavaScript(strings: TemplateStringsArray): Expression {
  // TODO: Check
  return (esprima.parseScript(strings[0]).body[0] as estree.ExpressionStatement).expression as Expression
}

///////////////////////////////////////////////////////////////////////////////
// EVALUATOR

export type Value = ArrowFunctionExpression

export function evaluate(expression: Expression): Value {
  switch (expression.type) {
    case "ArrowFunctionExpression": return expression
    case "CallExpression":
      const { params: [param], body } = evaluate(expression.callee)
      const argument = evaluate(expression.arguments[0])
      return evaluate(substitute(param, body, argument))
    case "Identifier": throw new Error(`Unbound ‘${expression.name}’.`)
  }

  function substitute(
    param: Identifier,
    body: Expression,
    argument: Value
  ): Expression {
    return traverse(body)

    function traverse(expression: Expression): Expression {
      switch (expression.type) {
        case "ArrowFunctionExpression":
          return _.isEqual(expression.params[0], param) ? expression : { ...expression, body: traverse(expression.body) }
        case "CallExpression":
          return { ...expression, callee: traverse(expression.callee), arguments: [traverse(expression.arguments[0])] }
        case "Identifier":
          return _.isEqual(expression, param) ? argument : expression
      }
    }
  }
}

///////////////////////////////////////////////////////////////////////////////
// TESTS

describe("evaluate()", () => {
  test("a function is already a value", () => {
    expect(evaluate(YoctoJavaScript`x => x`)).toEqual(YoctoJavaScript`x => x`)
  })

  test.each([
    [YoctoJavaScript`(x => x) (y => y)`, YoctoJavaScript`y => y`],
    [YoctoJavaScript`(x => z => x) (y => y)`, YoctoJavaScript`z => y => y`]
  ] as [Expression, Value][])(
    "a call substitutes the argument in the function body",
    (program, expectedValue) => { expect(evaluate(program)).toEqual(expectedValue) }
  )

  test("substitution doesn’t affect shadowed Identifiers", () => {
    expect(evaluate(YoctoJavaScript`(x => x => x) (y => y)`)).toEqual(YoctoJavaScript`x => x`)
  })

  test("programs with undefined Identifiers throw an error", () => {
    expect(() => evaluate(YoctoJavaScript`x`)).toThrow()
  })
})
