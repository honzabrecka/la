const fs = require('fs')
const test = require('ava')
const {last, pipe, prop} = require('ramda')
const {tokenize, ast, parse, evaluate, exprToString, la} = require('./interpret')

const lalast = pipe(la, last)

const lalaste = pipe(la, last, prop('expr'))

const la_core = fs.readFileSync('core.la', 'utf8')
const la_typed = fs.readFileSync('typed.la', 'utf8')

const lala = pipe((expr) => la(la_core + la_typed + expr), last, prop('expr'))
const lalane = pipe((expr) => la(la_core + la_typed + expr), last, prop('exprName'))

test('interpret: tokenize', t => {
  t.deepEqual(tokenize('(a bc d (ef))'), ['(', 'a', 'bc', 'd', '(', 'ef', ')', ')'])
})

test('interpret: ast', t => {
  t.deepEqual(ast([], ['(', 'a', 'bc', 'd', '(', 'ef', ')', ')']), [['a', 'bc', 'd', ['ef']]])
})

test('interpret: exprToString', t => {
  t.is(exprToString(['a', 'bc', 'd', ['ef']]), '(a bc d (ef))')
})

test('interpret: la: function has expr', t => {
  t.is(lalaste('(# (x) x)'), '(# (x) x)')
})

test('interpret: la: function defined with def has exprName', t => {
  t.is(lalast('(def id (# (x) x)) id').exprName, 'id')
})

test('interpret: la: function defined with def has expr', t => {
  t.is(lalaste('(def id (# (x) x)) id'), '(# (x) x)')
})

test('interpret: la: direct function exection', t => {
  t.is(lalaste('((# (x) x) (# (y) y))'), '(# (y) y)')
})

test('interpret: la: function defined with def exection', t => {
  t.is(lalaste('(def id (# (x) x)) (id (# (y) y))'), '(# (y) y)')
})

test('interpret: la: named args do not interfere', t => {
  t.is(lalaste('(def a (# (x) x)) (def x (# (a b) a)) ((a x) (# (y) y))'), '(# (y) y)')
})

test('core.la: not', t => {
  t.is(lalane('(not true)'), 'false')
  t.is(lalane('(not false)'), 'true')
})

test('core.la: and', t => {
  t.is(lalane('(and true true)'), 'true')
  t.is(lalane('(and true false)'), 'false')
  t.is(lalane('(and false true)'), 'false')
  t.is(lalane('(and false false)'), 'false')
})

test('core.la: or', t => {
  t.is(lalane('(or true true)'), 'true')
  t.is(lalane('(or true false)'), 'true')
  t.is(lalane('(or false true)'), 'true')
  t.is(lalane('(or false false)'), 'false')
})

test('core.la: bool-equal?', t => {
  t.is(lalane('(bool-equal? true true)'), 'true')
  t.is(lalane('(bool-equal? true false)'), 'false')
  t.is(lalane('(bool-equal? false true)'), 'false')
  t.is(lalane('(bool-equal? false false)'), 'true')
})

test('core.la: if', t => {
  t.is(lalane('(if true (# () true) (# () false))'), 'true')
  t.is(lalane('(if false (# () true) (# () false))'), 'false')
})

test('core.la: identity', t => {
  t.is(lalane('(identity true)'), 'true')
})

test('core.la: 0?', t => {
  t.is(lalane('(0? 0)'), 'true')
  t.is(lalane('(0? 1)'), 'false')
  t.is(lalane('(0? 2)'), 'false')
})

test('core.la: =', t => {
  t.is(lalane('(= 0 0)'), 'true')
  t.is(lalane('(= 1 1)'), 'true')
  t.is(lalane('(= 2 2)'), 'true')
  t.is(lalane('(= 0 2)'), 'false')
  t.is(lalane('(= 2 0)'), 'false')
})

test('core.la: >', t => {
  t.is(lalane('(> 0 0)'), 'false')
  t.is(lalane('(> 1 1)'), 'false')
  t.is(lalane('(> 1 0)'), 'true')
  t.is(lalane('(> 2 0)'), 'true')
  t.is(lalane('(> 0 1)'), 'false')
  t.is(lalane('(> 0 2)'), 'false')
})

test('core.la: >=', t => {
  t.is(lalane('(>= 0 0)'), 'true')
  t.is(lalane('(>= 1 1)'), 'true')
  t.is(lalane('(>= 1 0)'), 'true')
  t.is(lalane('(>= 2 0)'), 'true')
  t.is(lalane('(>= 0 1)'), 'false')
  t.is(lalane('(>= 0 2)'), 'false')
})

test('core.la: <', t => {
  t.is(lalane('(< 0 0)'), 'false')
  t.is(lalane('(< 1 1)'), 'false')
  t.is(lalane('(< 0 1)'), 'true')
  t.is(lalane('(< 0 2)'), 'true')
  t.is(lalane('(< 1 0)'), 'false')
  t.is(lalane('(< 2 0)'), 'false')
})

test('core.la: <=', t => {
  t.is(lalane('(<= 0 0)'), 'true')
  t.is(lalane('(<= 1 1)'), 'true')
  t.is(lalane('(<= 0 1)'), 'true')
  t.is(lalane('(<= 0 2)'), 'true')
  t.is(lalane('(<= 1 0)'), 'false')
  t.is(lalane('(<= 2 0)'), 'false')
})

test('core.la: +', t => {
  t.is(lalane('(= 3 (+ 1 2))'), 'true')
})

test('core.la: -', t => {
  t.is(lalane('(= 1 (- 3 2))'), 'true')
})

test('core.la: *', t => {
  t.is(lalane('(= 6 (* 2 3))'), 'true')
})

test('core.la: /', t => {
  t.is(lalane('(= 3 (/ 6 2))'), 'true')
})

test('core.la: ^', t => {
  t.is(lalane('(= 8 (^ 2 3))'), 'true')
})

test('core.la: %', t => {
  t.is(lalane('(= 1 (% 3 2))'), 'true')
})

test('typed.la: is?', t => {
  t.is(lalane('(is? BOOL TRUE)'), 'true')
  t.is(lalane('(is? BOOL FALSE)'), 'true')
})
