import * as _ from "lodash"

namespace YoctoJavaScript {
  export type Expression = Function | Call | Variable

  export type Function = {
    readonly kind: "Function"
    readonly variable: Variable
    readonly body: Expression
  }

  export type Call = {
    readonly kind: "Call"
    readonly function: Expression
    readonly argument: Expression
  }

  export type Variable = {
    readonly kind: "Variable"
    readonly name: string
  }
}

type Value = YoctoJavaScript.Function

function evaluate(expression: YoctoJavaScript.Expression): Value {
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
  variable: YoctoJavaScript.Variable,
  in_: YoctoJavaScript.Expression,
  for_: YoctoJavaScript.Expression
): YoctoJavaScript.Expression {
  function traverse(in_: YoctoJavaScript.Expression): YoctoJavaScript.Expression {
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
    })).toEqual({
      kind: "Function",
      variable: { kind: "Variable", name: "x" },
      body: { kind: "Variable", name: "x" }
    })
  })

  test.each([
    [
      {
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
      },
      {
        kind: "Function",
        variable: { kind: "Variable", name: "y" },
        body: { kind: "Variable", name: "y" }
      }
    ],
    [
      {
        kind: "Call",
        function: {
          kind: "Function",
          variable: { kind: "Variable", name: "x" },
          body: {
            kind: "Function",
            variable: { kind: "Variable", name: "z" },
            body: { kind: "Variable", name: "x" }
          }
        },
        argument: {
          kind: "Function",
          variable: { kind: "Variable", name: "y" },
          body: { kind: "Variable", name: "y" }
        }
      },
      {
        kind: "Function",
        variable: { kind: "Variable", name: "z" },
        body: {
          kind: "Function",
          variable: { kind: "Variable", name: "y" },
          body: { kind: "Variable", name: "y" }
        }
      }
    ]
  ] as [YoctoJavaScript.Expression, Value][])(
    "a call substitutes the argument in the function body",
    (program, expectedValue) => { expect(evaluate(program)).toEqual(expectedValue) }
  )

  test("substitution doesn’t affect shadowed variables", () => {
    expect(evaluate({
      kind: "Call",
      function: {
        kind: "Function",
        variable: { kind: "Variable", name: "x" },
        body: {
          kind: "Function",
          variable: { kind: "Variable", name: "x" },
          body: { kind: "Variable", name: "x" }
        }
      },
      argument: {
        kind: "Function",
        variable: { kind: "Variable", name: "y" },
        body: { kind: "Variable", name: "y" }
      }
    })).toEqual({
      kind: "Function",
      variable: { kind: "Variable", name: "x" },
      body: { kind: "Variable", name: "x" }
    })
  })

  test("programs with undefined variables throw an error", () => {
    expect(() => evaluate({ kind: "Variable", name: "x" })).toThrow()
  })
})
