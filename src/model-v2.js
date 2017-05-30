module.exports = class Model {
  constructor (attributes = {}) {
    this.attributes = attributes

    return new Proxy(() => {}, this)
  }

  apply (target, thisArg, argumentsList) {
    return this
  }

  get (target, prop) {
    return this.attributes[prop]
  }

  set (target, prop, value) {
    return this.attributes[prop] = value
  }
}