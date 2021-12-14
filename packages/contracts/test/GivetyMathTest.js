const GivetyMathTester = artifacts.require("./GivetyMathTester.sol")

contract('GivetyMath', async accounts => {
  let givetyMathTester
  beforeEach('deploy tester', async () => {
    givetyMathTester = await GivetyMathTester.new()
  })

  const checkFunction = async (func, cond, params) => {
    assert.equal(await givetyMathTester[func](...params), cond(...params))
  }

  it('max works if a > b', async () => {
    await checkFunction('callMax', (a, b) => Math.max(a, b), [2, 1])
  })

  it('max works if a = b', async () => {
    await checkFunction('callMax', (a, b) => Math.max(a, b), [2, 2])
  })

  it('max works if a < b', async () => {
    await checkFunction('callMax', (a, b) => Math.max(a, b), [1, 2])
  })
})
