const {
  append, apply, curryN, filter,
  head, isArrayLike, length, map,
  merge, nth, pipe, replace,
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
    const closure = (...args) => evaluate(merge(env, zipObj(params, args)), body)
    closure.expr = exprToString(x)
    closure.exprName = defName
    return closure
  }
  const [name, ...rest] = x
  return apply(evaluate(env, name), map(evaluate(env), rest))
})

const exprToString = (expr) => `(${map((e) => isArrayLike(e) ? exprToString(e) : e, expr).join(' ')})`

const la = pipe(parse, map(evaluate({})))

module.exports = {
  tokenize,
  ast,
  parse,
  evaluate,
  exprToString,
  la
}
