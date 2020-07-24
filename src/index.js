'use strict'

const Blitz = require('./blitz.js')

Blitz.addFilter( require('./filters/hermite.js') )

module.exports = Object.create(Blitz)
exports = module.exports