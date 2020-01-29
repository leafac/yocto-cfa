import { parseScript } from "esprima";
import { generate } from "escodegen";
import { format } from "prettier";

export function evaluate(input: string): string {
  return prettyPrint(step(parse(input)));
}

type Expression = ArrowFunctionExpression | CallExpression | Identifier;

interface ArrowFunctionExpression {
  type: "ArrowFunctionExpression";
  params: [Identifier];
  body: Expression;
}

interface CallExpression {
  type: "CallExpression";
  callee: Expression;
  arguments: [Expression];
}

interface Identifier {
  type: "Identifier";
  name: string;
}

function parse(input: string): Expression {
  const program = parseScript(input, {}, node => {
    switch (node.type) {
      case "Program":
        if (node.body.length !== 1)
          throw new Error(
            "Unsupported Yocto-JavaScript feature: Program with multiple statements"
          );
        break;
      case "ExpressionStatement":
        break;
      case "ArrowFunctionExpression":
        break;
      case "CallExpression":
        if (node.arguments.length !== 1)
          throw new Error(
            "Unsupported Yocto-JavaScript feature: CallExpression with multiple arguments"
          );
        break;
      case "Identifier":
        break;
      default:
        throw new Error(`Unsupported Yocto-JavaScript feature: ${node.type}`);
    }
  });
  return (program as any).body[0].expression as Expression;
}

type Value = ArrowFunctionExpression;

function step(expression: Expression): Value {
  switch (expression.type) {
    case "ArrowFunctionExpression":
      return expression;
    case "CallExpression":
      const {
        params: [{ name }],
        body
      } = step(expression.callee);
      const argument = step(expression.arguments[0]);
      return step(substitute(body));
      function substitute(expression: Expression): Expression {
        switch (expression.type) {
          case "ArrowFunctionExpression":
            if (expression.params[0].name === name) return expression;
            return {
              ...expression,
              body: substitute(expression.body)
            };
          case "CallExpression":
            return {
              ...expression,
              callee: substitute(expression.callee),
              arguments: [substitute(expression.arguments[0])]
            };
          case "Identifier":
            if (expression.name === name) return argument;
            return expression;
        }
      }
    case "Identifier":
      throw new Error(`Reference to undefined variable: ${expression.name}`);
  }
}

function prettyPrint(value: Value): string {
  return format(generate(value), { parser: "babel", semi: false }).trim();
}
