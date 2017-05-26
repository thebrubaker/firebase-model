const assert = require('assert')
const sinon = require('sinon')
const Model = require('../src/model')
const { _key, _attributes } = require('../src/symbols')

describe('Model', function() {
  it('should take attributes as an argument for constructor', function() {
    let model = new Model({foo: 'bar'})
    assert(model.getAttributes().foo === 'bar')
  })
  it('should have a default configuration', function() {
    let model = new Model()
    assert(model.getConfig('location') === '/')
    assert(model.getConfig('embeds').length === 0)
    assert(model.getConfig('fillable').length === 0)
  })
  it('should set the configuration for the model', function() {
    let model = new Model()
    model.setConfig({
      location: 'foo',
      embeds: ['foo'],
      fillable: ['foo']
    })
    assert(model.getConfig('location') === 'foo')
    assert(model.getConfig('embeds')[0] === 'foo')
    assert(model.getConfig('fillable')[0] === 'foo')
  })
  it('should have a trap for accessing properties from the model', function() {
    let model = new Model({foo: 'bar'})
    assert(model.foo === model.getAttributes().foo)
  })
  it('should have a trap for setting properties on the model', function() {
    let model = new Model()
    model.foo = 'bar'
    assert(model.foo === model.getAttributes().foo)
  })
  it('should output data with attributes and key of the model', function() {
    let model = new Model({foo: 'bar'})
    model.setKey('foo')
    assert(model.data().foo === 'bar')
    assert(model.data().key === 'foo')
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
    let stub = sinon.stub(model, 'push').callsFake(callback => {
      callback({ key: 'test-key' })
    })
    model.create({ foo: 'bar' })
    assert(model.push.called)
    assert(model.getKey() === 'test-key')
    assert(model.foo === 'bar')
    assert(model.bar === 'baz')
    stub.restore()
  })
  it('should be able to save itself as a new model', function() {
    let model = new Model({
      foo: 'bar',
      bar: 'baz'
    })
    let stub = sinon.stub(model, 'push').callsFake(callback => {
      callback({ key: 'test-key' })
    })
    model.save()
    assert(model.push.called)
    assert(model.getKey() === 'test-key')
    assert(model.foo === 'bar')
    assert(model.bar === 'baz')
    stub.restore()
  })
  it('should be able to save itself as an update', function() {
    let model = new Model({
      foo: 'bar',
      bar: 'baz'
    })
    model.setKey('test-key')
    let stub = sinon.stub(model, 'update')
    model.save()
    assert(model.update.called)
    assert(model.getKey() === 'test-key')
    assert(model.foo === 'bar')
    assert(model.bar === 'baz')
    stub.restore()
  })
  it('should be able to fill attributes', function() {
    let model = new Model()
    model.fill({foo: 'bar'})
    assert(model.foo === 'bar')
  })
  it('should return all attributes', function() {
    let model = new Model({ foo: 'bar' })
    assert(model.foo === 'bar')
  })
  it('should be able to set the location', function() {
    let model = new Model()
    model.setLocation('foo')
    assert(model.getLocation() === 'foo')
  })
  it('should return a reference to the location of the model', function() {
    let model = new Model()
    model.setLocation('foo')
    let ref = model.reference()
    assert(ref.key === 'foo')
  })
  it('should execute a provided callback when returning a reference to the location of the model', function() {
    let model = new Model()
    model.setLocation('foo')
    let callback = sinon.spy()
    model.reference(callback)
    assert(callback.called)
    assert(callback.args[0][0].key === 'foo')
    assert(callback.args[0][1] === model)
  })
  it('should pipe a callback or value', function() {
    let model = new Model()
    let callback = sinon.spy()
    model.pipe(callback)
    assert(callback.called)
    assert(callback.args[0][0] === model)
    let value = model.pipe(123)
    assert(123)
  })
})