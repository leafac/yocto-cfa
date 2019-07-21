import * as _ from "lodash"

namespace YJS {
  export type Expression = Function | Call | Variable

  export type Function = {
    kind: "Function"
    variable: Variable
    body: Expression
  }

  export type Call = {
    kind: "Call"
    function: Expression
    argument: Expression
  }

  export type Variable = {
    kind: "Variable"
    name: string
  }
}

type Value = YJS.Function

function evaluate(expression: YJS.Expression): Value {
  switch (expression.kind) {
    case "Function": return expression
    case "Call":
      const { variable, body } = evaluate(expression.function)
      const argument = evaluate(expression.argument)
      return evaluate(substitute(variable, body, argument))
    case "Variable": throw new Error(`Undefined variable ‘${expression}’.`)
  }
}

function substitute(
  variable: YJS.Variable, in_: YJS.Expression, for_: YJS.Expression
): YJS.Expression {
  function traverse(in_: YJS.Expression): YJS.Expression {
    switch (in_.kind) {
      case "Function":
        return _.isEqual(in_.variable, variable) ? in_ : { ...in_, body: traverse(in_.body) }
      case "Call":
        return { ...in_, function: traverse(in_.function), argument: traverse(in_.argument) }
      case "Variable":
        return _.isEqual(in_, variable) ? for_ : in_
    }
  }

  return traverse(in_)
}

describe("evaluate()", () => {
  test("a function is already a value", () => {
    expect(evaluate({
      kind: "Function",
      variable: { kind: "Variable", name: "x" },
      body: { kind: "Variable", name: "x" }
    })).toMatchObject({
      kind: "Function",
      variable: { kind: "Variable", name: "x" },
      body: { kind: "Variable", name: "x" }
    })
  })

  test("arguments are substituted in function bodies", () => {
    expect(evaluate({
      kind: "Call",
      function: {
        kind: "Function",
        variable: { kind: "Variable", name: "x" },
        body: { kind: "Variable", name: "x" }
      },
      argument: {
        kind: "Function",
        variable: { kind: "Variable", name: "y" },
        body: { kind: "Variable", name: "y" }
      }
    })).toMatchObject({
      kind: "Function",
      variable: { kind: "Variable", name: "y" },
      body: { kind: "Variable", name: "y" }
    })
  })

  test("programs with undefined variables throw an error", () => {
    expect(() => evaluate({ kind: "Variable", name: "x" })).toThrow()
  })
})
