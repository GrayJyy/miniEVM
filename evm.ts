const PUSH0 = 0x5F
const PUSH1 = 0x60
const PUSH32 = 0x7F
const POP = 0x50
const ADD = 0x01
const MUL = 0x02

class EVM {
    private code: Uint8Array; // 每个 EVM 字节码指令占用一个字节（8 比特），EVM 字节码的指令范围是从 0x00 到 0xFF，共 256 个不同的指令
    private pc: number; // 计数器
    private stack: number[]; //堆栈

    constructor(code: Uint8Array) {
        this.code = code;
        this.pc = 0;
        this.stack = [];
    }

    nextInstruction(): number {
        const op = this.code[this.pc];
        this.pc += 1;
        return op;
    }

    push(size: number): void {
        const data = this.code.slice(this.pc, this.pc + size); // 在这个例子里首次进来时计数器已经来到了1
        const value = parseInt([...data].map(byte => byte.toString(16).padStart(2, '0')).join(''), 16);
        this.stack.push(value);
        this.pc += size;
    }

    pop(): void {
        if (this.stack.length === 0) throw new Error("Stack underflow");
        this.stack.pop()
    }

    add(): void {
        if (this.stack.length < 2) throw new Error("Stack underflow");
        const item1 = this.stack.pop()!
        const item2 = this.stack.pop()!
        const addResult = (item1 + item2) % (2 ** 256)
        this.stack.push(addResult)
    }


    run(): void {
        while (this.pc < this.code.length) {
            const op = this.nextInstruction();
            // 如果遇到PUSH操作，则执行
            if (op >= PUSH1 && op <= PUSH32) {
                const size = op - PUSH1 + 1; // PUSH(size) 
                this.push(size);
            } else if (op === PUSH0) {
                this.stack.push(0);
            } else if (op === POP) {
                this.pop();
            } else if (op === ADD) {
                this.add();
            }
        }
        console.log(this.stack); // 测试堆栈
    }
}

// 示例用法
const testPush = () => {
    // code = b"\x60\x02\x60\x03\x01"
    const code = new Uint8Array([0x60, 0x01, 0x60, 0x01]);
    const evm = new EVM(code);
    evm.run(); // 输出:  [1, 1]
}

const testPop = () => {
    const code = new Uint8Array([0x60, 0x01, 0x50])
    const evm = new EVM(code);
    evm.run(); // 输出:  []
}

const testAdd = () => {
    const code = new Uint8Array([0x60, 0x02, 0x60, 0x03, 0x01]);
    const evm = new EVM(code);
    evm.run(); // 输出:  [5]
}


testPush()
testPop()
testAdd()