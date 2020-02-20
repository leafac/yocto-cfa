import { parseScript } from "esprima";
import { Node } from "estree";
import { generate } from "escodegen";
import { format } from "prettier";
import { Map } from "immutable";

export function evaluate(input: string): PrettyValue {
  return prettify(run(parse(input), Map()));
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

type Value = Closure;

interface Closure {
  function: ArrowFunctionExpression;
  environment: Environment;
}

type Environment = Map<string, Value>;

function run(expression: Expression, environment: Environment): Value {
  switch (expression.type) {
    case "ArrowFunctionExpression":
      return { function: expression, environment };
    case "CallExpression":
      const {
        function: {
          params: [{ name: parameter }],
          body
        },
        environment: functionEnvironment
      } = run(expression.callee, environment);
      const argument = run(expression.arguments[0], environment);
      return run(
        body,
        // TODO: Double-check that tests cover the common mistake of saying ‘environment’ on the line below.
        // TODO: Add example: ‘((x => x => x)(y => y))(z => z)’.
        functionEnvironment.set(parameter, argument)
      );
    case "Identifier":
      const { name } = expression;
      if (!environment.has(name))
        throw new Error(`Reference to undefined variable: ${name}`);
      return environment.get(name)!;
  }
}

function parse(input: string): Expression {
  const program = parseScript(input, {}, checkFeatures);
  const expression = (program as any).body[0].expression as Expression;
  return expression;
  function checkFeatures(node: Node): void {
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
  }
}

interface PrettyValue {
  function: string;
  environment: Map<string, PrettyValue>;
}

function prettify(value: Value): PrettyValue {
  return {
    function: format(generate(value.function), {
      parser: "babel",
      semi: false
    }).trim(),
    environment: value.environment.map(prettify)
  };
}
