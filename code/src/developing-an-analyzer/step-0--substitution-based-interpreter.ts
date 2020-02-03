import { parseScript } from "esprima";
import { generate } from "escodegen";
import { format } from "prettier";

export function evaluate(input: string): string {
  return unload(run(load(input)));
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

type Value = ArrowFunctionExpression;

function run(expression: Expression): Value {
  switch (expression.type) {
    case "ArrowFunctionExpression":
      return expression;
    case "CallExpression":
      if (
        expression.callee.type !== "ArrowFunctionExpression" ||
        expression.arguments[0].type !== "ArrowFunctionExpression"
      )
        throw new Error("NOT IMPLEMENTED YET");
      throw new Error("NOT IMPLEMENTED YET");
    case "Identifier":
      throw new Error("NOT IMPLEMENTED YET");
  }
}

// function run(expression: Expression): Value {
//   switch (expression.type) {
//     case "ArrowFunctionExpression":
//       return expression;
//     case "CallExpression":
//       const {
//         params: [{ name }],
//         body
//       } = run(expression.callee);
//       const argument = run(expression.arguments[0]);
//       return run(substitute(body));
//       function substitute(expression: Expression): Expression {
//         switch (expression.type) {
//           case "ArrowFunctionExpression":
//             if (expression.params[0].name === name) return expression;
//             return {
//               ...expression,
//               body: substitute(expression.body)
//             };
//           case "CallExpression":
//             return {
//               ...expression,
//               callee: substitute(expression.callee),
//               arguments: [substitute(expression.arguments[0])]
//             };
//           case "Identifier":
//             if (expression.name === name) return argument;
//             return expression;
//         }
//       }
//     case "Identifier":
//       throw new Error(`Reference to undefined variable: ${expression.name}`);
//   }
// }

function load(input: string): Expression {
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
  const expression = (program as any).body[0].expression as Expression;
  return expression;
}

function unload(value: Value): string {
  return format(generate(value), { parser: "babel", semi: false }).trim();
}
