const assert = require('assert')
const sinon = require('sinon')
const Model = require('../src/model-v2')
let firebase = require('firebase-admin')
const serviceAccount = require('../service-account.json')

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://spice-traders-core.firebaseio.com"
})

describe('Model', function() {
  it('should proxy all calls to attributes, unless invoked as a function', function() {
    let ship = new Model({
      name: 'Enterprise'
    })
    assert(ship().attributes.name === 'Enterprise')
    assert(ship.name === 'Enterprise')
  })
  it('should set its location in firebase', function() {
    let model = new Model()
    model.setLocation('foo')
    assert(model.getLocation() === 'foo')
  })
  it('should initialize with a firebase connection', function() {
    Model.init(firebase)
    let model = new Model()
    assert(model().firebase === firebase)
  })
  it('should set attributes', function() {
    let model = new Model()
    model.setAttributes({ foo: 'bar' })
    assert(model.foo === 'bar')
  })
  it('should be extensible', function() {
    class Ship extends Model {
      location () {
        return 'ship'
      }
    }
    let ship = new Ship()
    assert(ship.getLocation() === 'ship')
  })
  it('should create a model', done => {
    let model = new Model()
    model.setLocation('test')
    model.create({ name: 'test' }).then(model => {
      assert(model.name === 'test')
      assert(model.key !== undefined)
      done()
    }).catch(error => {
      done(error)
    })
  })
  it('should statically create a model', done => {
    class Ship extends Model {
      location () {
        return 'ship'
      }
    }
    Ship.create({ name: 'test' }).then(ship => {
      assert(ship.name === 'test')
      assert(ship.key !== undefined)
      done()
    }).catch(error => {
      done(error)
    })
  })
})