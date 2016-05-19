const {
  append, apply, curry, filter,
  head, isArrayLike, length, map,
  merge, nth, pipe, replace,
  split, tail, trim, values,
  zipObj
} = require('ramda')

const fs = require('fs')

const tokenize = pipe(trim, replace(/\(/g, '( '), replace(/\)/g, ' )'), split(/\s+/))

const ast = curry((list, tokens) => {
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

const evaluate = curry((env, x) => {
  if (!isArrayLike(x)) {
    return env[x]
  }
  if (x[0] === 'def') {
    const [, name, exp] = x
    env[name] = evaluate(env, exp)
    return
  }
  if (x[0] === '#') {
    const [, params, body] = x
    return (...args) => evaluate(merge(env, zipObj(params, args)), body)
  }
  const [name, ...rest] = x
  return apply(evaluate(env, name), map(evaluate(env), rest))
})

const la = pipe(parse, map(evaluate({})))

module.exports = {
  tokenize,
  ast,
  parse,
  evaluate,
  la
}
