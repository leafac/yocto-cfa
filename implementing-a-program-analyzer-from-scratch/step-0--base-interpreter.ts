import { ArrowFunctionExpression, Expression, Identifier } from "../languages/yocto-javascript"
import * as _ from "lodash"

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
