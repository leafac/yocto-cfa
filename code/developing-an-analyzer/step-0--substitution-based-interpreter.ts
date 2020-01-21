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
  return checkAndCleanup(program.body[0].expression, new Set<string>());

  function checkAndCleanup(
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
          body: checkAndCleanup(
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
          callee: checkAndCleanup(node.callee, definedVariables),
          arguments: [checkAndCleanup(node.arguments[0], definedVariables)]
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
