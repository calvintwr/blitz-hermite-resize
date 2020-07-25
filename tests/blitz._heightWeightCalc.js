'use strict'

const Blitz = require('../src/blitz.js')
const chai = require('chai')
const should = chai.should()

chai.use(require('sinon-chai'))
require('mocha-sinon')


beforeEach(function() {
    this.sinon.stub(console, 'warn')
})


describe('_heightWidthCalc', function() {

    describe('scaling with definite height and width', function() {

        it('should return original image height and width', function() {
            Blitz._heightWidthCalc(100, 200).should.deep.own.include({ height: 100, width: 200 })
        })

        it('should return "resizeTo" width and height', function() {
            Blitz._heightWidthCalc(100, 200, 101, 250).should.deep.own.include({ height: 101, width: 250 })
        })

        it('should return "resizeTo" width and height despite enforcing proportions', function() {
            Blitz._heightWidthCalc(100, 200, 101, 250, null, null, null, null, true).should.deep.own.include({ height: 101, width: 250 })
            console.warn.calledWith('Warn: `proportional` is ignored when both `height` and `width` are provided.').should.be.true
        })

        it('should return "resizeTo" width and height and ignore min/max height', function() {
            Blitz._heightWidthCalc(100, 200, 101, 250, 3, 4, 5, 6).should.deep.own.include({ height: 101, width: 250 })
            console.warn.calledWith('Warn: `min/maxHeight` or `min/maxWidth` are ignored when `height` and/or `width` are supplied.').should.be.true
        })

        it('should return "resizeTo" width and scaled height (maintaining proportions) and ignore min/max height', function() {
            Blitz._heightWidthCalc(100, 200, null, 250, 3, 4, 5, 6).should.deep.own.include({ height: 125, width: 250 })
            console.warn.calledWith('Warn: `min/maxHeight` or `min/maxWidth` are ignored when `height` and/or `width` are supplied.').should.be.true
        })
    })

    describe('throw errors when max/min definitions are conflicting', function() {

        it('should throw error when minHeight > maxHeight', function() {
            (() => {
                Blitz._heightWidthCalc(100, 200, null, null, 100, null, 200)
            }).should.Throw(Error, '`minHeight` cannot be larger than `maxHeight.')
        })

        it('should throw error when minWidth > maxWidth', function() {
            (() => {
                Blitz._heightWidthCalc(100, 200, null, null, null, 400, null, 401)
            }).should.Throw(Error, '`minWidth` cannot be larger than `maxWidth.')
        })

        it('should throw error when both mins > both maxes', function() {
            (() => {
                Blitz._heightWidthCalc(100, 200, null, null, 100, 400, 101, 401)
            }).should.Throw(Error, '`minHeight` cannot be larger than `maxHeight. `minWidth` cannot be larger than `maxWidth.')
        })

    })

    describe('maxHeight and maxWidth scaling', function() {

        describe('proportional = false, without defined mins', function() {

            it('should return downscale to max height and width (smaller)', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 50, 101, null, null, false).should.deep.own.include({ height: 50, width: 101 })
            })

            it('should return original height/width if maxes are large)', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 101, 201, null, null, false).should.deep.own.include({ height: 100, width: 200 })
            })

        })

        describe('proportional DOWN scaling, with defined max ONLY', function() {

            it('should return original height/width if maxes are large (proportional explicit true)', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 101, 201, null, null, true).should.deep.own.include({ height: 100, width: 200 })
            })

            it('should return downscale, limited to maxHeight (limiting factor), where maxWidth provided', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 50, 101, null, null).should.deep.own.include({ height: 50, width: 100 })
            })

            it('should return downscale, limited to maxWidth (limiting factor), where maxHeight provided', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 51, 100, null, null).should.deep.own.include({ height: 50, width: 100 })
            })

        })

        describe('proportional = false, with defined mins', function() {

            // not able to define conflicting mins due in-built safety, so no need to check
            it('should return downscale to max height and width (smaller), non-affecting defined mins', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 50, 101, 49, 100, false).should.deep.own.include({ height: 50, width: 101 })
            })

            it('should return original height/width if maxes are large, non-affecting defined mins', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 101, 201, 100, 200, false).should.deep.own.include({ height: 100, width: 200 })
            })

        })

        describe('proportional DOWN scaling, non-affecting defined max and mins', function() {

            it('should return original height/width, proportional explicit true', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 101, 201, 44, 66, true).should.deep.own.include({ height: 100, width: 200 })
            })

            it('should return original height/width, proportional explicit false', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 101, 201, 44, 66, false).should.deep.own.include({ height: 100, width: 200 })
            })

            it('should return original height/width, proportional undefined (defaulted true)', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 101, 201, 44, 66, false).should.deep.own.include({ height: 100, width: 200 })
            })

        })

        describe('proportional DOWN scaling, with affecting defined max and mins', function() {

            it('should return downscale, limited to maxHeight (limiting factor), where maxWidth provided, non-affecting mins defined', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 50, 101, 44, 60).should.deep.own.include({ height: 50, width: 100 })
            })

            it('should return downscale, limited to maxHeight (limiting factor), where maxWidth provided, limited to minWidth -- with no warnings', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 50, 200, 44, 150).should.deep.own.include({ height: 50, width: 150 })
            })

            it('should return downscale, width of maxWidth (limiting), where maxHeight provided, height of minHeight (limiting) -- with no warnings', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 83, 101, 55, 99).should.deep.own.include({ height: 55, width: 101 })
            })

            it('should return downscale, limited to maxHeight (limiting factor), where maxWidth provided, limited to minWidth, proportional explicit true -- with warnings', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 50, 200, 44, 150, true).should.deep.own.include({ height: 50, width: 150 })
                console.warn.calledWith('Warn: Unable to maintain image proportionality. Enforcing minWidth of 150 as scaling image to maxHeight of 50 gives scaled width of 100.').should.be.true
            })

            it('should return downscale, width of maxWidth (limiting), where maxHeight provided, height of minHeight (limiting), proportional explicit true -- with warnings', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 83, 101, 55, 99, true).should.deep.own.include({ height: 55, width: 101 })
                console.warn.calledWith('Warn: Unable to maintain image proportionality. Enforcing minHeight of 55 as scaling image to maxWidth of 101 gives scaled height of 51.').should.be.true
            })

            it('should return downscale, limited to maxHeight, non-affecting mins defined', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 50, null, 44, 60).should.deep.own.include({ height: 50, width: 100 })
            })

            it('should return downscale, limited to maxHeight, limited to minWidth -- with no warnings', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 50, null, 44, 150).should.deep.own.include({ height: 50, width: 150 })
            })

            it('should return downscale, width of maxWidth (limiting), height of minHeight (limiting) -- with no warnings', function() {
                Blitz._heightWidthCalc(100, 200, null, null, null, 101, 55, 99).should.deep.own.include({ height: 55, width: 101 })
            })

            it('should return downscale, limited to maxHeight (limiting factor), limited to minWidth, proportional explicit true -- with warnings', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 50, null, 44, 150, true).should.deep.own.include({ height: 50, width: 150 })
                console.warn.calledWith('Warn: Unable to maintain image proportionality. Enforcing minWidth of 150 as scaling image to maxHeight of 50 gives scaled width of 100.').should.be.true
            })

            it('should return downscale, width of maxWidth (limiting), height of minHeight (limiting), proportional explicit true -- with warnings', function() {
                Blitz._heightWidthCalc(100, 200, null, null, null, 101, 55, 99, true).should.deep.own.include({ height: 55, width: 101 })
                console.warn.calledWith('Warn: Unable to maintain image proportionality. Enforcing minHeight of 55 as scaling image to maxWidth of 101 gives scaled height of 51.').should.be.true
            })
        })

        describe('proportional UP scaling, with affecting defined max and mins', function() {

            it('should upscale, limited to minHeight (limiting factor), where minWidth provided, limited to maxWidth -- with no warnings', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 400, 304, 203, 150).should.deep.own.include({ height: 203, width: 304 })
            })

            it('should upscale, width of minWidth (limiting), where minHeight provided, height of maxHeight (limiting) -- with no warnings', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 83, 589, 55, 403).should.deep.own.include({ height: 83, width: 403 })
            })

            it('should upscale, limited to minHeight (limiting factor), where minWidth provided, limited to maxWidth, proportional explicit true -- with warnings', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 245, 434, 245, 150, true).should.deep.own.include({ height: 245, width: 434 })
                console.warn.calledWith('Warn: Unable to maintain image proportionality. Enforcing maxWidth of 434 as scaling image to minHeight of 245 gives scaled width of 490.').should.be.true
            })

            it('should upscale, width of minWidth (limiting), where minHeight provided, height of maxHeight (limiting), proportional explicit true -- with warnings', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 101, 589, 55, 403, true).should.deep.own.include({ height: 101, width: 403 })
                console.warn.calledWith('Warn: Unable to maintain image proportionality. Enforcing maxHeight of 101 as scaling image to minWidth of 403 gives scaled height of 202.').should.be.true
            })

            it('should upscale, limited to minHeight, non-affecting mins defined', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 180, 400, 150, 60).should.deep.own.include({ height: 150, width: 300 })
            })

            it('should upscale, limited to minHeight, limited to maxWidth -- with no warnings', function() {
                Blitz._heightWidthCalc(100, 200, null, null, null, 202, 200, 150).should.deep.own.include({ height: 200, width: 202 })
            })

            it('should upscale, width of minWidth (limiting), height of maxHeight (limiting) -- with no warnings', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 150, null, 55, 400).should.deep.own.include({ height: 150, width: 400 })
            })

            it('should upscale, limited to minHeight, limited to maxWidth, proportional explicit true -- with warning', function() {
                Blitz._heightWidthCalc(100, 200, null, null, null, 202, 200, 150, true).should.deep.own.include({ height: 200, width: 202 })
                console.warn.calledWith('Warn: Unable to maintain image proportionality. Enforcing maxWidth of 202 as scaling image to minHeight of 200 gives scaled width of 400.').should.be.true
            })

            it('should upscale, width of minWidth (limiting), height of maxHeight (limiting), proportional explicit true -- with warning', function() {
                Blitz._heightWidthCalc(100, 200, null, null, 150, null, 55, 400, true).should.deep.own.include({ height: 150, width: 400 })
                console.warn.calledWith('Warn: Unable to maintain image proportionality. Enforcing maxHeight of 150 as scaling image to minWidth of 400 gives scaled height of 200.').should.be.true
            })
        })
    })
})