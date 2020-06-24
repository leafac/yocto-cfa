import * as babelParser from "@babel/parser";
import * as babelTypes from "@babel/types";
import * as babelGenerator from "@babel/generator";

export function evaluate(input: string): string {
  return generate(run(parse(input)));
}

type Expression = ArrowFunctionExpression | CallExpression | Identifier;

type ArrowFunctionExpression = {
  type: "ArrowFunctionExpression";
  params: [Identifier];
  body: Expression;
};

type CallExpression = {
  type: "CallExpression";
  callee: Expression;
  arguments: [Expression];
};

type Identifier = {
  type: "Identifier";
  name: string;
};

type Value = ArrowFunctionExpression;

function run(expression: Expression): Value {
  switch (expression.type) {
    case "ArrowFunctionExpression":
      return expression;
    case "CallExpression":
      const {
        params: [parameter],
        body,
      } = run(expression.callee);
      const argument = run(expression.arguments[0]);
      return run(substitute(body));
      function substitute(expression: Expression): Expression {
        switch (expression.type) {
          case "ArrowFunctionExpression":
            if (expression.params[0].name === parameter.name) return expression;
            return {
              ...expression,
              body: substitute(expression.body),
            };
          case "CallExpression":
            return {
              ...expression,
              callee: substitute(expression.callee),
              arguments: [substitute(expression.arguments[0])],
            };
          case "Identifier":
            if (expression.name !== parameter.name) return expression;
            return argument;
        }
      }
    case "Identifier":
      throw new Error(`Reference to undefined variable: ${expression.name}`);
  }
}

function parse(input: string): Expression {
  const expression = babelParser.parseExpression(input);
  babelTypes.traverse(expression, (node) => {
    switch (node.type) {
      case "ArrowFunctionExpression":
        if (node.params.length !== 1)
          throw new Error(
            "Unsupported Yocto-JavaScript feature: ArrowFunctionExpression doesn’t have exactly one parameter"
          );
        if (node.params[0].type !== "Identifier")
          throw new Error(
            "Unsupported Yocto-JavaScript feature: ArrowFunctionExpression param isn’t an Identifier"
          );
        break;
      case "CallExpression":
        if (node.arguments.length !== 1)
          throw new Error(
            "Unsupported Yocto-JavaScript feature: CallExpression doesn’t have exactly one argument"
          );
        break;
      case "Identifier":
        break;
      default:
        throw new Error(`Unsupported Yocto-JavaScript feature: ${node.type}`);
    }
  });
  return expression as Expression;
}

function generate(value: Value): string {
  return babelGenerator.default(value as any).code;
}
