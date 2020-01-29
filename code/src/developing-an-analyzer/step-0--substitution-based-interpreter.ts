import { parseScript } from "esprima";
import * as ESTree from "estree";

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

export function parse(input: string): Expression {
  const program = parseScript(input);
  if (program.body.length !== 1)
    throw new Error("‘Program’ has a ‘body’ whose length isn’t exactly one.");
  if (program.body[0].type !== "ExpressionStatement")
    throw new Error(
      "‘Program’ has a ‘body’ that isn’t an ‘ExpressionStatement’."
    );
  return checkAndClean(program.body[0].expression, new Set<string>());

  function checkAndClean(
    node: ESTree.Node,
    definedVariables: Set<string>
  ): Expression {
    switch (node.type) {
      case "ArrowFunctionExpression":
        if (node.params.length !== 1)
          throw new Error(
            "‘ArrowFunctionExpression’ doesn’t have exactly one ‘param’."
          );
        if (node.params[0].type !== "Identifier")
          throw new Error(
            "‘ArrowFunctionExpression’ has a ‘param’ that isn’t an ‘Identifier’."
          );
        return {
          type: node.type,
          params: [
            {
              type: node.params[0].type,
              name: node.params[0].name
            }
          ],
          body: checkAndClean(
            node.body,
            new Set([...definedVariables, node.params[0].name])
          )
        };
      case "CallExpression":
        if (node.arguments.length !== 1)
          throw new Error(
            "‘CallExpression’ doesn’t have exactly one ‘argument’."
          );
        return {
          type: node.type,
          callee: checkAndClean(node.callee, definedVariables),
          arguments: [checkAndClean(node.arguments[0], definedVariables)]
        };
      case "Identifier":
        if (!definedVariables.has(node.name))
          throw new Error(`Variable reference to ‘${node.name}’ not in scope.`);
        return {
          type: node.type,
          name: node.name
        };
      default:
        throw new Error(`Invalid node type: ‘${node.type}’.`);
    }
  }
}

type Value = ArrowFunctionExpression;

export function evaluate(input: string): Value {
  return step(parse(input));
  function step(expression: Expression): Value {
    switch (expression.type) {
      case "ArrowFunctionExpression":
        return expression;
      case "CallExpression":
        if (
          expression.callee.type !== "ArrowFunctionExpression" ||
          expression.arguments[0].type !== "ArrowFunctionExpression"
        )
          throw "TODO";
        const {
          params: [{ name }],
          body
        } = expression.callee;
        //     const {
        //       params: [{ name }],
        //       body
        //     } = step(expression.callee);
        const argument = expression.arguments[0];
        const bodyAfterSubstitution = substitute(body);
        if (bodyAfterSubstitution.type !== "ArrowFunctionExpression")
          throw "TODO";
        return bodyAfterSubstitution;
        //     const argument = step(expression.arguments[0]);
        //     return step(substitute(body));
        function substitute(expression: Expression): Expression {
          switch (expression.type) {
            case "ArrowFunctionExpression":
              //           if (expression.params[0].name === name) return expression;
              return {
                ...expression,
                body: substitute(expression.body)
              };
            case "CallExpression":
              throw "TODO";
            //           return {
            //             ...expression,
            //             callee: substitute(expression.callee),
            //             arguments: [substitute(expression.arguments[0])]
            //           };
            case "Identifier":
              return argument;
            //           if (expression.name === name) return argument;
            //           return expression;
          }
        }
      case "Identifier":
        throw "TODO";
      //     throw new Error(`The parser already checks for references to undefined variables.`);
    }
  }
}
