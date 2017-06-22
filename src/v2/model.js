let mix = require('./mixin')
let HasAttributes = require('./has-attributes')
let HasRelationships = require('./has-relationships')

let Model = class Model {
  constructor (attributes = {}) {
    this.fill(attributes)

    return new Proxy(() => {}, this)
  }

  apply (target, thisArg, argumentsList) {
    return this
  }

  get (target, key) {
    return this.getAttribute(key)
  }

  set (target, key, value) {
    return this.setAttribute(key, value)
  }

  static fetch (id) {

  }

  static all () {

  }

  static stream (id, callback) {

  }

  static streamAll (callback) {

  }

  static create (attributes) {

  }


  save () {

  }

  update (attributes) {

  }

  fill (attributes) {

  }

  validate (callback) {

  }

}

module.exports = mix(Model).with(HasAttributes, HasRelationships)