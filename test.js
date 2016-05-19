const {append, last, reduce} = require('ramda')

const fs = require('fs')

const {la} = require('./interpret')

const assert = (tests, output) => {
  const result = reduce((result, [expr, expected]) =>
    last(la(core + typed + expr))(true, false) === expected ? result : append(expr, result)
  , [], tests)

  output(result.length === 0 ? 'OK!' : reduce((m, expr) => `${m}  ${expr}\n`, 'Error:\n\n', result))

  return result.length === 0 ? 0 : 1
}

const core = fs.readFileSync('core.la', 'utf8')
const typed = fs.readFileSync('typed.la', 'utf8')

const tests = [
  ['true', true],
  ['false', false],
  ['(= 4 (+ 3 1))', true],
  ['(is? BOOL TRUE)', true]
]

process.exit(assert(tests, console.log.bind(console)))
