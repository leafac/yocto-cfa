import * as _ from "lodash"

interface Expression {
  evaluate(): Value
  substitute(variable: Variable, expression: Expression): Expression
}

class Function_ implements Expression {
  constructor(
    public readonly variable: Variable,
    public readonly body: Expression
  ) { }

  evaluate(): Value {
    return this
  }

  substitute(variable: Variable, expression: Expression): Expression {
    if (_.isEqual(this.variable, variable)) {
      return this
    } else {
      return new Function_(
        this.variable,
        this.body.substitute(variable, expression)
      )
    }
  }
}

class Call implements Expression {
  constructor(
    public readonly function_: Expression,
    public readonly argument: Expression
  ) { }

  evaluate(): Value {
    const function_ = this.function_.evaluate()
    const argument = this.argument.evaluate()
    return function_.body.substitute(function_.variable, argument).evaluate()
  }

  substitute(variable: Variable, expression: Expression): Expression {
    return new Call(
      this.function_.substitute(variable, expression),
      this.argument.substitute(variable, expression)
    )
  }
}

class Variable implements Expression {
  constructor(public readonly name: string) { }

  evaluate(): Value {
    throw new Error(`Undefined variable ‘${this}’.`)
  }

  substitute(variable: Variable, expression: Expression): Expression {
    if (_.isEqual(this, variable)) {
      return expression
    } else {
      return this
    }
  }
}

type Value = Function_

describe("evaluate()", () => {
  test("functions evaluate to themselves", () => {
    expect(
      new Function_(new Variable("x"), new Variable("x")).evaluate()
    ).toEqual(
      new Function_(new Variable("x"), new Variable("x"))
    )
  })

  test("calls substitute the argument in the function body", () => {
    expect(
      new Call(
        new Function_(new Variable("x"), new Variable("x")),
        new Function_(new Variable("y"), new Variable("y"))
      ).evaluate()
    ).toEqual(
      new Function_(new Variable("y"), new Variable("y"))
    )
  })

  test.todo("arguments are substituted DEEP in function bodies")
  test.todo("shadowed arguments aren’t substituted")

  test("programs with undefined variables throw an error", () => {
    expect(() => new Variable("x").evaluate()).toThrow()
  })
})
