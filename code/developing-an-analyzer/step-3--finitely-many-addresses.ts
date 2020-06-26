import * as babelParser from "@babel/parser";
import * as babelTypes from "@babel/types";
import * as babelGenerator from "@babel/generator";
import { Map, Set } from "collections-deep-equal";

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

type Value = Set<Closure>;

type Environment = Map<Identifier["name"], Address>;

type Closure = {
  function: ArrowFunctionExpression;
  environment: Environment;
};

type Store = Map<Address, Value>;

type Address = Identifier;

function run(expression: Expression): { value: Value; store: Store } {
  const store: Store = new Map();
  return { value: step(expression, new Map()), store };
  function step(expression: Expression, environment: Environment): Value {
    switch (expression.type) {
      case "ArrowFunctionExpression": {
        return new Set([{ function: expression, environment }]);
      }
      case "CallExpression": {
        const value: Value = new Set();
        for (const {
          function: {
            params: [parameter],
            body,
          },
          environment: functionEnvironment,
        } of step(expression.callee, environment)) {
          const argument = step(expression.arguments[0], environment);
          const address = parameter;
          store.merge(new Map([[address, argument]]));
          value.merge(
            step(
              body,
              new Map(functionEnvironment).set(parameter.name, address)
            )
          );
        }
        return value;
      }
      case "Identifier": {
        const address = environment.get(expression.name);
        if (address === undefined)
          throw new Error(
            `Reference to undefined variable: ${expression.name}`
          );
        return store.get(address)!;
      }
    }
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

function generate(value: any): string {
  return JSON.stringify(
    value,
    (key, value) => {
      if (value.type !== undefined)
        return babelGenerator.default(value as any).code;
      return value;
    },
    2
  );
}
