import { parseScript } from "esprima";
import { Node } from "estree";
import { generate } from "escodegen";
import { format } from "prettier";
import { Map, Record, RecordOf } from "immutable";

export function evaluate(input: string): string {
  return prettify(run(parse(input)));
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

type Value = Closure;

type Closure = RecordOf<{
  function: ArrowFunctionExpression;
  environment: Environment;
}>;

type Environment = Map<Identifier["name"], Value>;

function run(expression: Expression): Value {
  return step(expression, Map());
  function step(expression: Expression, environment: Environment): Value {
    switch (expression.type) {
      case "ArrowFunctionExpression":
        return Closure({ function: expression, environment });
      case "CallExpression":
        const {
          function: {
            params: [parameter],
            body
          },
          environment: functionEnvironment
        } = step(expression.callee, environment);
        const argument = step(expression.arguments[0], environment);
        return step(
          body,
          Map(functionEnvironment).set(parameter.name, argument)
        );
      case "Identifier":
        const value = environment.get(expression.name);
        if (value === undefined)
          throw new Error(
            `Reference to undefined variable: ${expression.name}`
          );
        return value;
    }
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

function prettify(value: Value): string {
  return JSON.stringify(
    value,
    (key, value) => {
      if (value.type !== undefined)
        return format(generate(value), {
          parser: "babel",
          semi: false
        }).trim();
      return value;
    },
    2
  );
}

const Closure = Record({
  function: (undefined as unknown) as ArrowFunctionExpression,
  environment: (undefined as unknown) as Environment
}) as (values: Closure extends RecordOf<infer T> ? T : never) => Closure;
