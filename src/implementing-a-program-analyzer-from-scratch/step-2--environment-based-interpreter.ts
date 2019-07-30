import {
  ArrowFunctionExpression,
  Expression,
  IdentifierName,
  Value
} from "../languages/yocto-javascript";

type Closure = {
  function: ArrowFunctionExpression;
  environment: Environment;
};

type Environment = Map<IdentifierName, Closure>;

type State = {
  expression: Expression;
  environment: Environment;
};

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
      return { function: expression, environment };
    case "CallExpression":
      const {
        function: {
          params: [param],
          body
        },
        environment: functionEnvironment
      } = run({ expression: expression.callee, environment });
      const argument = run({
        expression: expression.arguments[0],
        environment
      });
      return run({
        expression: body,
        environment: new Map(functionEnvironment).set(param.name, argument)
      });
    case "Identifier":
      return environment.get(expression.name)!;
  }
}

function unload(dump: Dump): Value {
  return substituteNonlocals(dump);
}

function substituteNonlocals(closure: Closure): ArrowFunctionExpression {
  const { function: function_, environment } = closure;
  return traverse(function_, new Set()) as ArrowFunctionExpression;

  function traverse(
    expression: Expression,
    boundIdentifiers: Set<IdentifierName>
  ): Expression {
    switch (expression.type) {
      case "ArrowFunctionExpression":
        return {
          ...expression,
          body: traverse(
            expression.body,
            new Set(boundIdentifiers).add(expression.params[0].name)
          )
        };
      case "CallExpression":
        return {
          ...expression,
          callee: traverse(expression.callee, boundIdentifiers),
          arguments: [traverse(expression.arguments[0], boundIdentifiers)]
        };
      case "Identifier":
        return boundIdentifiers.has(expression.name)
          ? expression
          : substituteNonlocals(environment.get(expression.name)!);
    }
  }
}
