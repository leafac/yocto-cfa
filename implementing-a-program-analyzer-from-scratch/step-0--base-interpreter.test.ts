import { evaluate } from "./step-0--base-interpreter"
import { YJS } from "../languages/yocto-javascript"

describe("evaluate()", () => {
  test("a function is already a value", () => {
    expect(evaluate(YJS`x => x`)).toEqual(YJS`x => x`)
  })

  test.each([
    [YJS`(x => x) (y => y)`, YJS`y => y`],
    [YJS`(x => z => x) (y => y)`, YJS`z => y => y`]
  ])(
    "a call substitutes the argument in the function body",
    (program, expectedValue) => {
      expect(evaluate(program)).toEqual(expectedValue)
    }
  )

  test("substitution doesn’t affect shadowed Identifiers", () => {
    expect(evaluate(YJS`(x => x => x) (y => y)`)).toEqual(YJS`x => x`)
  })

  test("programs with undefined Identifiers throw an error", () => {
    expect(() => evaluate(YJS`x`)).toThrow()
  })

  test.todo("some programs run forever")
})
