import {
  ArrowFunctionExpression,
  Expression,
  IdentifierEnvironment,
  IdentifierName,
  Value
} from "../languages/yocto-javascript";

type Closure = {
  arrowFunctionExpression: ArrowFunctionExpression;
  environment: Environment;
};

type Environment = Map<IdentifierName, Closure>;

type State = {
  expression: Expression;
  environment: Environment;
};

// TODO: Turn Dump into object
type Dump = Closure;

export function evaluate(expression: Expression): Value {
  return unload(run(load(expression)));
}

function load(expression: Expression): State {
  return { expression, environment: new Map() };
}

function run(state: State): Dump {
  const { expression, environment } = state;
  switch (expression.type) {
    case "ArrowFunctionExpression":
      return { arrowFunctionExpression: expression, environment };
    case "CallExpression":
      const {
        arrowFunctionExpression: {
          params: [param],
          body
        },
        environment: calleeEnvironment
      } = run({ expression: expression.callee, environment });
      const argument = run({
        expression: expression.arguments[0],
        environment
      });
      return run({
        expression: body,
        environment: new Map(calleeEnvironment).set(param.name, argument)
      });
    case "Identifier":
      return environment.get(expression.name)!;
  }
}

function unload(dump: Dump): Value {
  return substituteNonlocals(dump);
}

function substituteNonlocals(closure: Closure): ArrowFunctionExpression {
  const { arrowFunctionExpression, environment } = closure;
  return traverse(
    arrowFunctionExpression,
    new Set()
  ) as ArrowFunctionExpression;

  function traverse(
    expression: Expression,
    identifierEnvironment: IdentifierEnvironment
  ): Expression {
    switch (expression.type) {
      case "ArrowFunctionExpression":
        return {
          ...expression,
          body: traverse(
            expression.body,
            new Set(identifierEnvironment).add(expression.params[0].name)
          )
        };
      case "CallExpression":
        return {
          ...expression,
          callee: traverse(expression.callee, identifierEnvironment),
          arguments: [traverse(expression.arguments[0], identifierEnvironment)]
        };
      case "Identifier":
        return identifierEnvironment.has(expression.name)
          ? expression
          : substituteNonlocals(environment.get(expression.name)!);
    }
  }
}
