const PUSH0 = 0x5f
const PUSH1 = 0x60
const PUSH32 = 0x7f
const POP = 0x50
const ADD = 0x01
const MUL = 0x02
const SUB = 0x03
const DIV = 0x04
const MOD = 0x06
const LT = 0x10
const GT = 0x11
const EQ = 0x14

class EVM {
  private code: Uint8Array // 每个 EVM 字节码指令占用一个字节（8 比特），EVM 字节码的指令范围是从 0x00 到 0xFF，共 256 个不同的指令
  private pc: number // 计数器
  private stack: number[] //堆栈

  constructor(code: Uint8Array) {
    this.code = code
    this.pc = 0
    this.stack = []
  }

  nextInstruction(): number {
    const op = this.code[this.pc]
    this.pc += 1
    return op
  }

  push(size: number): void {
    const data = this.code.slice(this.pc, this.pc + size) // 在这个例子里首次进来时计数器已经来到了1
    const value = parseInt([...data].map(byte => byte.toString(16).padStart(2, '0')).join(''), 16)
    this.stack.push(value)
    this.pc += size
  }

  pop(): void {
    if (this.stack.length === 0) throw new Error('Stack underflow')
    this.stack.pop()
  }

  add(): void {
    if (this.stack.length < 2) throw new Error('Stack underflow')
    const item1 = this.stack.pop()!
    const item2 = this.stack.pop()!
    const addResult = (item1 + item2) % 2 ** 256
    this.stack.push(addResult)
  }

  mul(): void {
    if (this.stack.length < 2) throw new Error('Stack underflow')
    const item1 = this.stack.pop()!
    const item2 = this.stack.pop()!
    const mulResult = (item1 * item2) % 2 ** 256
    this.stack.push(mulResult)
  }
  sub(): void {
    if (this.stack.length < 2) throw new Error('Stack underflow')
    const item1 = this.stack.pop()!
    const item2 = this.stack.pop()!
    const subResult = (item1 - item2) % 2 ** 256
    this.stack.push(subResult)
  }
  div(): void {
    if (this.stack.length < 2) throw new Error('Stack underflow')
    const item1 = this.stack.pop()!
    const item2 = this.stack.pop()!
    if (item2 === 0) {
      this.stack.push(0)
      return
    }
    const divResult = (item1 / item2) % 2 ** 256
    this.stack.push(divResult)
  }
  mod(): void {
    if (this.stack.length < 2) throw new Error('Stack underflow')
    const item1 = this.stack.pop()!
    const item2 = this.stack.pop()!
    const modResult = item2 !== 0 ? (item1 % item2) % 2 ** 256 : 0
    this.stack.push(modResult)
  }
  lt(): void {
    if (this.stack.length < 2) throw new Error('Stack underflow')
    const item1 = this.stack.pop()!
    const item2 = this.stack.pop()!
    const ltResult = item1 < item2 ? 1 : 0
    this.stack.push(ltResult)
  }
  gt(): void {
    if (this.stack.length < 2) throw new Error('Stack underflow')
    const item1 = this.stack.pop()!
    const item2 = this.stack.pop()!
    const gtResult = item1 > item2 ? 1 : 0
    this.stack.push(gtResult)
  }
  eq(): void {
    if (this.stack.length < 2) throw new Error('Stack underflow')
    const item1 = this.stack.pop()!
    const item2 = this.stack.pop()!
    const eqResult = item2 === item1 ? 1 : 0
    this.stack.push(eqResult)
  }

  run(): void {
    while (this.pc < this.code.length) {
      const op = this.nextInstruction()
      // 如果遇到PUSH操作，则执行
      if (op >= PUSH1 && op <= PUSH32) {
        const size = op - PUSH1 + 1 // PUSH(size)
        this.push(size)
      } else if (op === PUSH0) {
        this.stack.push(0)
      } else if (op === POP) {
        this.pop()
      } else if (op === ADD) {
        this.add()
      } else if (op === MUL) {
        this.mul()
      } else if (op === SUB) {
        this.sub()
      } else if (op === DIV) {
        this.div()
      } else if (op === MOD) {
        this.mod()
      } else if (op === LT) {
        this.lt()
      } else if (op === GT) {
        this.gt()
      } else if (op === EQ) {
        this.eq()
      }
    }
    console.log(this.stack) // 测试堆栈
  }
}

// 示例用法
const testPush = () => {
  // code = b"\x60\x02\x60\x03\x01"
  const code = new Uint8Array([0x60, 0x01, 0x60, 0x01])
  const evm = new EVM(code)
  evm.run() // 输出:  [1, 1]
}

const testPop = () => {
  const code = new Uint8Array([0x60, 0x01, 0x50])
  const evm = new EVM(code)
  evm.run() // 输出:  []
}

const testAdd = () => {
  const code = new Uint8Array([0x60, 0x02, 0x60, 0x03, 0x01])
  const evm = new EVM(code)
  evm.run() // 输出:  [5]
}
const testMul = () => {
  const code = new Uint8Array([0x60, 0x02, 0x60, 0x03, 0x02])
  const evm = new EVM(code)
  evm.run() // 输出:  [6]
}

const testSub = () => {
  const code = new Uint8Array([0x60, 0x02, 0x60, 0x03, 0x03]) // 3 - 2
  const evm = new EVM(code)
  evm.run() // 输出:  [1]
}
const testDiv = () => {
  const code = new Uint8Array([0x60, 0x02, 0x60, 0x06, 0x04]) // 6 / 2
  const evm = new EVM(code)
  evm.run() // 输出:  [3]
}
const testMod = () => {
  const code = new Uint8Array([0x60, 0x02, 0x60, 0x06, 0x06]) // 6 % 2
  const evm = new EVM(code)
  evm.run() // 输出:  [0]
}
const testLt = () => {
  const code = new Uint8Array([0x60, 0x02, 0x60, 0x06, 0x10]) // 6 < 2
  const evm = new EVM(code)
  evm.run() // 输出:  [0]
}
const testGt = () => {
  const code = new Uint8Array([0x60, 0x02, 0x60, 0x06, 0x11]) // 6 > 2
  const evm = new EVM(code)
  evm.run() // 输出:  [1]
}
const testEq = () => {
  const code = new Uint8Array([0x60, 0x02, 0x60, 0x06, 0x14]) // 6 == 2
  const evm = new EVM(code)
  evm.run() // 输出:  [0]
}

testPush()
testPop()
testAdd()
testMul()
testSub()
testDiv()
testMod()
testLt()
testGt()
testEq()
