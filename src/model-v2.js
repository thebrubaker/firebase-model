let firebase
let _config = Symbol('config')

module.exports = class Model {
  constructor (attributes = {}) {
    this[_config] = {
      attributes: attributes,
      firebase: firebase,
      location: this.location(),
      key: null,
      loaded: false
    }

    return new Proxy(() => {}, this)
  }

  location () {
    return ''
  }

  get key () {
    return this[_config].key
  }

  apply (target, thisArg, argumentsList) {
    return this[_config]
  }

  get (target, prop) {
    if (this[_config].attributes[prop]) {
      return this[_config].attributes[prop]
    }
    
    return this[prop]
  }

  set (target, prop, value) {
    return this[_config].attributes[prop] = value
  }

  static init (instance) {
    firebase = instance
  }

  setLocation (location) {
    this[_config].location = location
  }

  getLocation (location) {
    return this[_config].location
  }

  setAttributes (attributes = {}) {
    Object.keys(attributes).forEach(key => {
      this[_config].attributes[key] = attributes[key]
    })

    return this
  }

  getAttributes () {
    return this[_config].attributes
  }

  setKey (key) {
    this[_config].key = key
    this[_config].loaded = true
  }

  isLoaded () {
    return this[_config].loaded
  }

  create (payload) {
    let model = this.isLoaded() ? this.newInstance(payload) : this.setAttributes(payload)

    return this.database().ref(this.getLocation()).push(model.attributes).then(({ key }) => {
      model.setKey(key)

      return model
    })
  }

  static create (payload) {
    let model = new this

    return model.create(payload)
  }

  newInstance (payload) {
    return Object.create(this).setAttributes(payload)
  }

  database () {
    if (this[_config].firebase === undefined) {
      throw Error('Firebase has not been initialized. Did you forget to run Model.init()?')
    }

    return this[_config].firebase.database()
  }
}