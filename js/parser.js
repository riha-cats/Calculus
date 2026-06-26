const FUNCTIONS = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  exp: Math.exp,
  ln: Math.log,
  log: Math.log10,
  sqrt: Math.sqrt,
  abs: Math.abs,
};

const CONSTANTS = { pi: Math.PI, e: Math.E };

const PREC = { "+": 2, "-": 2, "*": 3, "/": 3, neg: 4, "^": 5 };
const RIGHT = { "^": true };

function tokenize(src) {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === " " || ch === "\t") {
      i++;
    } else if (/[0-9.]/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      tokens.push({ t: "num", v: parseFloat(src.slice(i, j)) });
      i = j;
    } else if (/[a-zA-Z]/.test(ch)) {
      let j = i + 1;
      while (j < src.length && /[a-zA-Z]/.test(src[j])) j++;
      const name = src.slice(i, j);
      tokens.push({ t: name in FUNCTIONS ? "func" : "name", v: name });
      i = j;
    } else if (ch === "(") {
      tokens.push({ t: "lparen" });
      i++;
    } else if (ch === ")") {
      tokens.push({ t: "rparen" });
      i++;
    } else if ("+-*/^".includes(ch)) {
      tokens.push({ t: "op", v: ch });
      i++;
    } else {
      throw new Error("unexpected character: " + ch);
    }
  }
  return tokens;
}

function isValue(tok) {
  return tok && (tok.t === "num" || tok.t === "name" || tok.t === "rparen");
}

function startsValue(tok) {
  return (
    tok.t === "num" ||
    tok.t === "name" ||
    tok.t === "func" ||
    tok.t === "lparen"
  );
}

function popWhile(ops, out, cur) {
  while (ops.length) {
    const top = ops[ops.length - 1];
    if (top.t === "func") {
      out.push(ops.pop());
    } else if (top.t === "op") {
      const higher = RIGHT[cur] ? PREC[top.v] > PREC[cur] : PREC[top.v] >= PREC[cur];
      if (higher) out.push(ops.pop());
      else break;
    } else {
      break;
    }
  }
}

// shunting-yard, plus implicit * (2x, x(x+1)) and unary minus so -x^2 stays -(x^2)
function toRPN(tokens) {
  const out = [];
  const ops = [];
  let prev = null;

  for (const tok of tokens) {
    if (prev && isValue(prev) && startsValue(tok)) {
      popWhile(ops, out, "*");
      ops.push({ t: "op", v: "*" });
    }

    if (tok.t === "num") {
      out.push(tok);
    } else if (tok.t === "name") {
      if (tok.v in CONSTANTS) out.push({ t: "const", v: tok.v });
      else if (tok.v === "x") out.push({ t: "var" });
      else throw new Error("unknown name: " + tok.v);
    } else if (tok.t === "func") {
      ops.push(tok);
    } else if (tok.t === "lparen") {
      ops.push(tok);
    } else if (tok.t === "rparen") {
      while (ops.length && ops[ops.length - 1].t !== "lparen") out.push(ops.pop());
      if (!ops.length) throw new Error("mismatched parentheses");
      ops.pop();
      if (ops.length && ops[ops.length - 1].t === "func") out.push(ops.pop());
    } else {
      const unary =
        (tok.v === "-" || tok.v === "+") &&
        (prev === null || prev.t === "op" || prev.t === "lparen");
      if (unary) {
        if (tok.v === "-") ops.push({ t: "op", v: "neg" });
      } else {
        popWhile(ops, out, tok.v);
        ops.push(tok);
      }
    }
    prev = tok;
  }

  while (ops.length) {
    const op = ops.pop();
    if (op.t === "lparen") throw new Error("mismatched parentheses");
    out.push(op);
  }
  return out;
}

function applyOp(op, a, b) {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return a / b;
    case "^":
      return Math.pow(a, b);
  }
}

// throws on bad input; callers keep the last valid function
export function compile(src) {
  const rpn = toRPN(tokenize(src));
  return function (x) {
    const stack = [];
    for (const tok of rpn) {
      if (tok.t === "num") stack.push(tok.v);
      else if (tok.t === "var") stack.push(x);
      else if (tok.t === "const") stack.push(CONSTANTS[tok.v]);
      else if (tok.t === "func") stack.push(FUNCTIONS[tok.v](stack.pop()));
      else if (tok.v === "neg") stack.push(-stack.pop());
      else {
        const b = stack.pop();
        const a = stack.pop();
        stack.push(applyOp(tok.v, a, b));
      }
    }
    return stack.pop();
  };
}
