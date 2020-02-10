import { evaluate } from "./step-0--substitution-based-interpreter";

describe("run()", () => {
  testEvaluate("An Expression That Already Is a Value", "x => x", "x => x");

  testEvaluate(
    "A Call Involving Immediate Functions",
    "(x => x)(y => y)",
    "y => y"
  );

  testEvaluate(
    "Substitution in Function Definitions",
    "(x => z => x)(y => y)",
    "z => y => y"
  );

  testEvaluate("Name Mismatch", "(x => z => z)(y => y)", "z => z");

  testEvaluate("Name Reuse", "(x => x => x)(y => y)", "x => x");

  testEvaluate(
    "Substitution in Function Calls",
    "(x => z => x(x))(y => y)",
    "z => (y => y)(y => y)"
  );

  testEvaluate(
    "An Argument That Is Not Immediate",
    "(x => z => x)((a => a)(y => y))",
    "z => y => y"
  );

  testEvaluate(
    "A Function That Is Not Immediate",
    "((z => z)(x => x))(y => y)",
    "y => y"
  );

  testEvaluate(
    "Continuing to Run After a Function Call",
    "(x => (z => z)(x))(y => y)",
    "y => y"
  );

  testEvaluateError("Reference to undefined variable: y", "(x => y)(y => y)");

  testEvaluateError(
    "Maximum call stack size exceeded",
    "(f => f(f))(f => f(f))"
  );
});

describe("parse()", () => {
  testEvaluateError("Line 1: Unexpected end of input", "x =>");

  testEvaluateError(
    "Unsupported Yocto-JavaScript feature: Program with multiple statements",
    "x => x; y => y"
  );

  testEvaluateError(
    "Unsupported Yocto-JavaScript feature: CallExpression with multiple arguments",
    "f => a => b => f(a, b)"
  );

  testEvaluateError(`Unsupported Yocto-JavaScript feature: Literal`, "29");

  testEvaluateError(
    `Unsupported Yocto-JavaScript feature: VariableDeclarator`,
    "const f = x => x"
  );

  testEvaluateError(
    "Unsupported Yocto-JavaScript feature: SequenceExpression",
    "(x, y) => x"
  );

  testEvaluateError(
    "Unsupported Yocto-JavaScript feature: ArrayExpression",
    "([x, y]) => x"
  );
});

function testEvaluate(name: string, input: string, expectedOutput: string) {
  test(name, () => {
    expect(evaluate(input)).toEqual(expectedOutput);
  });
}

function testEvaluateError(name: string, input: string) {
  test(name, () => {
    expect(() => {
      evaluate(input);
    }).toThrow(name);
  });
}
