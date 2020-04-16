import * as esprima from "esprima";
import * as estree from "estree";
import * as escodegen from "escodegen";
import * as prettier from "prettier";
import { MapDeepEqual } from "collections-deep-equal";

export function evaluate(input: string): string {
  return stringify(run(parse(input)));
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

type Closure = {
  function: ArrowFunctionExpression;
  environment: Environment;
};

type Environment = MapDeepEqual<Identifier["name"], Address>;

type Store = MapDeepEqual<Address, Value>;

type Address = number;

function run(expression: Expression): { value: Value; store: Store } {
  const store: Store = new MapDeepEqual();
  return { value: step(expression, new MapDeepEqual()), store };
  function step(expression: Expression, environment: Environment): Value {
    switch (expression.type) {
      case "ArrowFunctionExpression": {
        return { function: expression, environment };
      }
      case "CallExpression": {
        const {
          function: {
            params: [parameter],
            body,
          },
          environment: functionEnvironment,
        } = step(expression.callee, environment);
        const argument = step(expression.arguments[0], environment);
        const address = store.size;
        store.set(address, argument);
        return step(
          body,
          new MapDeepEqual(functionEnvironment).set(parameter.name, address)
        );
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
  const program = esprima.parseScript(input, { range: true }, checkFeatures);
  const expression = (program as any).body[0].expression as Expression;
  return expression;
  function checkFeatures(node: estree.Node): void {
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

function stringify(value: any): string {
  return JSON.stringify(
    value,
    (key, value) => {
      if (value.type !== undefined)
        return prettier
          .format(escodegen.generate(value), {
            parser: "babel",
            semi: false,
            arrowParens: "avoid",
          })
          .trim();
      return value;
    },
    2
  );
}
