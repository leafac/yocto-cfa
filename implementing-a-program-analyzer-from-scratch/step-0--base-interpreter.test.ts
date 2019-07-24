import { evaluate } from "./step-0--base-interpreter"
import { YJS } from "../languages/yocto-javascript"

test("a function is already a value", () => {
  expect(evaluate(YJS`x => x`)).toEqual(YJS`x => x`)
})

test.each([
  [YJS`(x => x)(y => y)`, YJS`y => y`],
  [YJS`(x => z => x)(y => y)`, YJS`z => y => y`]
])(
  "a call substitutes the argument in the function body",
  (program, expectedValue) => {
    expect(evaluate(program)).toEqual(expectedValue)
  }
)

test("substitution doesn’t affect shadowed Identifiers", () => {
  expect(evaluate(YJS`(x => x => x)(y => y)`)).toEqual(YJS`x => x`)
})

test("substitution doesn’t affect other Identifiers", () => {
  expect(evaluate(YJS`(x => z => z)(y => y)`)).toEqual(YJS`z => z`)
})

test("programs with unbound Identifiers throw an error", () => {
  expect(() => evaluate(YJS`x`)).toThrow()
})

test.todo("the evaluation of some programs doesn’t terminate")
