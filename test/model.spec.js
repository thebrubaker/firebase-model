const assert = require('assert')
const sinon = require('sinon')
const Model = require('../')
const { _key, _attributes } = require('../symbols')

describe('Model', function() {
  it('should have a default location', function() {
    let model = new Model({
      location: false
    })
    assert(model.getLocation() === '/')
  })
  it('should take attributes as an argument for constructor', function() {
    let model = new Model({foo: 'bar'})
    assert(model.attributes.foo === 'bar')
  })
  it('should have a trap for accessing properties from attributes', function() {
    let model = new Model({foo: 'bar'})
    assert(model.foo === model.attributes.foo)
  })
  it('should have a trap for setting properties on attributes', function() {
    let model = new Model()
    model.foo = 'bar'
    assert(model.foo === model.attributes.foo)
  })
  it('should output attributes as json', function() {
    let model = new Model()
    model.foo = 'bar'
    assert(typeof model.json() === 'string')
    assert(JSON.parse(model.json()).foo === 'bar')
  })
  it('should create a new model and persist it', function() {
    let model = new Model({
      foo: false,
      bar: 'baz'
    })
    sinon.stub(model, 'push').callsFake(callback => {
      callback({ key: 'test-key' })
    })
    model.create({ foo: 'bar' })
    assert(model.push.called)
    assert(model.getKey() === 'test-key')
    assert(model.foo === 'bar')
    assert(model.bar === 'baz')
  })
})