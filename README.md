## EVM执行模型

1. 当一个交易被接收并准备执行时，以太坊会初始化一个新的执行环境并加载合约的字节码。
2. 字节码被翻译成Opcode，被逐一执行。每个Opcodes代表一种操作，比如算术运算、逻辑运算、存储操作或者跳转到其他操作码。
3. 每执行一个Opcodes，都要消耗一定数量的Gas。如果Gas耗尽或者执行出错，执行就会立即停止，所有的状态改变（除了已经消耗的Gas）都会被回滚。
4. 执行完成后，交易的结果会被记录在区块链上，包括Gas的消耗、交易日志等信息。

## Opcodes分类

[EVM Codes](https://www.evm.codes/?fork=shanghai)

- **堆栈（Stack）指令**: 这些指令直接操作EVM堆栈。这包括将元素压入堆栈（如`PUSH1`）和从堆栈中弹出元素（如`POP`）。
- **算术（Arithmetic）指令**: 这些指令用于在EVM中执行基本的数学运算，如加法（`ADD`）、减法（`SUB`）、乘法（`MUL`）和除法（`DIV`）。
- **比较（Comparison）指令**: 这些指令用于比较堆栈顶部的两个元素。例如，大于（`GT`）和小于（`LT`）。
- **位运算（Bitwise）指令**: 这些指令用于在位级别上操作数据。例如，按位与（`AND`）和按位或（`OR`）。
- **内存（Memory）指令**: 这些指令用于操作EVM的内存。例如，将内存中的数据读取到堆栈（`MLOAD`）和将堆栈中的数据存储到内存（`MSTORE`）。
- **存储（Storage）指令**: 这些指令用于操作EVM的账户存储。例如，将存储中的数据读取到堆栈（`SLOAD`）和将堆栈中的数据保存到存储（`SSTORE`）。这类指令的gas消耗比内存指令要大。
- **控制流（Control Flow）指令**: 这些指令用于EVM的控制流操作，比如跳转`JUMP`和跳转目标`JUMPDEST`。
- **上下文（Context）指令**: 这些指令用于获取交易和区块的上下文信息。例如，获取msg.sender（`CALLER`）和当前可用的gas（`GAS`）。

## 一个简单的加法运算

```bash
PUSH1 0x01
PUSH1 0x01
ADD
PUSH0
MSTORE
```

## Typescript版本的简单EVM计数器

```tsx
class EVM {
   private code: Uint8Array // 每个 EVM 字节码指令占用一个字节（8 比特）,EVM 字节码的指令范围是从 0x00 到 0xFF，共 256 个不同的指令
   private counter: number // 计数器
   private stack: number[] // 堆栈

   constructor(code: Uint8Array) {
      this.code = code
      this.counter = 0
      this.stack = []
   }

   nextInstruction(): number {
      const op = this.code[this.counter]
      this.counter+= 1
      return op
   }

   run(): void {
      while (this.counter < this.code.length) {
         const op = this.nextInstruction()
         console.log(op);

         // 执行指令的逻辑
         // ...
      }
   }
}

// 使用示例
const code = new Uint8Array([0x60, 0x01, 0x60, 0x01, 0x50])
const evm = new EVM(code)
evm.run()
```

### 实现PUSH

<aside>
💡 `PUSH`操作码范围为`0x60`到`0x7F` 。它们将一个字节大小为1到32字节的值从字节码压入堆栈（堆栈中每个元素的长度为32字节），gas消耗为3。以太坊上海升级后新增`PUSH0` ，用来把0压入堆栈，gas消耗为2。

</aside>

```tsx
const PUSH0 = 0x5F
const PUSH1 = 0x60
const PUSH32 = 0x7F

class EVM {
 // ......

    push(size: number): void {
        const data = this.code.slice(this.counter, this.counter + size); // 在这个例子里首次进来时计数器已经来到了1
        const value = parseInt([...data].map(byte => byte.toString(16).padStart(2, '0')).join(''), 16);
        this.stack.push(value);
        this.counter += size;
    }

    run(): void {
        while (this.counter < this.code.length) {
            const op = this.nextInstruction();
            // 如果遇到PUSH操作，则执行
            if (op >= PUSH1 && op <= PUSH32) {
                const size = op - PUSH1 + 1; // PUSH(size) 
                this.push(size);
            } else if (op === PUSH0) {
                this.stack.push(0);
            }
        }
        console.log(evm.stack); // 测试堆栈
    }
}

// 示例用法
const code = new Uint8Array([0x60, 0x01, 0x60, 0x01]);
const evm = new EVM(code);
evm.run(); // 输出:  [1, 1]
```

### 实现POP

<aside>
💡 `POP` 操作码为`0x50` ,用于从栈顶移除一个元素，gas消耗为2,如果栈为空，则抛出一个错误。

</aside>

```tsx
const POP = 0x50
// ....
pop(): void {
        if (this.stack.length === 0) throw new Error("Stack underflow");
        this.stack.pop()
    }
```

### 实现ADD

<aside>
💡 `ADD` 操作码为`0x01` ,会将栈顶的两个元素弹出相加以后放回，如果栈顶元素不足两个会抛出错误，gas消耗为3。

</aside>

```tsx
const ADD = 0x01
add(): void {
        if (this.stack.length < 2) throw new Error("Stack underflow");
        const item1 = this.stack.pop()!
        const item2 = this.stack.pop()!
        const addResult = (item1 + item2) % (2 ** 256) // 防止溢出，结果为0～2^256-1
        this.stack.push(addResult)
    }
```

### 实现 MUL

<aside>
💡 `MUL`指令将堆栈的顶部两个元素相乘。操作码是`0x02`，gas消耗为`5`。

</aside>

```solidity
const MUL = 0x02
mul(): void {
    if (this.stack.length < 2) throw new Error('Stack underflow')
    const item1 = this.stack.pop()!
    const item2 = this.stack.pop()!
    const mulResult = (item1 * item2) % 2 ** 256
    this.stack.push(mulResult)
  }
```

### 实现SUB

<aside>
💡 `SUB`指令从堆栈顶部弹出两个元素，然后计算第一个元素减去第二个元素，最后将结果推入堆栈。这个指令的操作码是`0x03`，gas消耗为`3` 。

</aside>

```solidity
const SUB = 0x03
sub(): void {
    if (this.stack.length < 2) throw new Error('Stack underflow')
    const item1 = this.stack.pop()!
    const item2 = this.stack.pop()!
    const subResult = (item1 - item2) % 2 ** 256
    this.stack.push(subResult)
  }
```

### 实现 DIV

<aside>
💡 `DIV`指令从堆栈顶部弹出两个元素，然后将第一个元素除以第二个元素，最后将结果推入堆栈。如果第二个元素（除数）为0，则将0推入堆栈。这个指令的操作码是`0x04`，gas消耗为`5` 。

</aside>

```solidity
const DIV = 0x04
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
```

### 实现 MOD

<aside>
💡 取模指令。这个指令会从堆栈中弹出两个元素，然后将第一个元素除以第二个元素的余数推入堆栈。如果第二个元素（除数）为0，结果为0。它的操作码是`0x06`，gas消耗为5。

</aside>

```solidity
const MOD = 0x06
mod(): void {
    if (this.stack.length < 2) throw new Error('Stack underflow')
    const item1 = this.stack.pop()!
    const item2 = this.stack.pop()!
    const modResult = item2 !== 0 ? (item1 % item2) % 2 ** 256 : 0
    this.stack.push(modResult)
  }
```