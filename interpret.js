const {
  append, apply, curryN, filter,
  head, isArrayLike, join, length,
  map, merge, nth, pipe, replace,
  split, tail, trim, values,
  zipObj
} = require('ramda')

const tokenize = pipe(trim, replace(/\(/g, '( '), replace(/\)/g, ' )'), split(/\s+/))

const ast = curryN(2, (list, tokens) => {
  if (length(tokens) == 0) {
    return list
  }
  if (head(tokens) == '(') {
    const x = ast([], tail(tokens))
    return ast(append(nth(0, x), list), nth(1, x))
  }
  if (head(tokens) == ')') {
    return [list, tail(tokens)]
  }
  return ast(append(head(tokens), list), tail(tokens))
})

const parse = pipe(tokenize, ast([]))

const evaluate = curryN(2, (env, x, defName) => {
  if (!isArrayLike(x)) {
    return env[x]
  }
  if (x[0] === 'def') {
    const [, name, exp] = x
    env[name] = evaluate(env, exp, name)
    return
  }
  if (x[0] === '#') {
    const [, params, body] = x
    const lambda = (...args) => evaluate(merge(env, zipObj(params, args)), body)
    lambda.expr = exprToString(x)
    lambda.exprName = defName
    return lambda
  }
  const [name, ...rest] = x
  return apply(evaluate(env, name), map(evaluate(env), rest))
})

const wrap = curryN(3, (start, end, value) => start + value + end)

const exprToString = pipe(map((exp) => isArrayLike(exp) ? exprToString(exp) : exp), join(' '), wrap('(', ')'))

const la = pipe(parse, map(evaluate({})))

module.exports = {
  tokenize,
  ast,
  parse,
  evaluate,
  exprToString,
  la
}
