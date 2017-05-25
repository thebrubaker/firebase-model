const { _key, _attributes, _location } = require('./symbols')
const firebase = require('./firebase')

/**
 * 
 */
module.exports = class Model {

  /**
   * Define the location of this model's reference in firebase.
   * @return {string}  The reference location.
   */
  get location () {
    return '/'
  }

  /**
   * The constructor for the class. Sets the attributes on the model and then
   * returns a new Proxy object that traps all calls on the model and proxies them
   * back to itself. This allows for checking what property is being accessed,
   * and deciding how to return a value from that property. See the get () and set ()
   * methods below for an understanding of why we are using Proxy to trap calls
   * on the model.
   * @param  {Object} attributes  The attributes to fill the model.
   * @return {Model}
   */
  constructor (attributes = {}) {
    this.setAttributes(attributes)
    this.setLocation(this.location)

    return new Proxy(this, this)
  }

  /**
   * Get a property from this model. If the property exists on the attributes
   * object, return that attribute. Otherwise return the property from the model
   * itself.
   * @param  {Model} this  This model.
   * @param  {string} property  The property to access on this model.
   * @return {mixed}  The value of the property.
   */
  get (model, property) {
    if (model[_attributes][property] !== undefined) {
      return model[_attributes][property]
    }

    return model[property]
  }

  /**
   * Set a property on the model. All properties are set on the attributes
   * object rather than the model itself.
   * @param {Model} this  This model.
   * @param {string} property  The name of the property to set.
   * @param {mixed} value  The value of the property to set.
   */
  set (model, property, value) {
    return model[_attributes][property] = value
  }

  /**
   * Return the model's attributes
   * @return {Object}
   */
  get attributes () {
    return this[_attributes]
  }

  /**
   * Return the model's attributes as JSON.
   * @return {string}
   */
  json () {
    return JSON.stringify(
      Object.assign(this[_attributes], { key: this.getKey() })
    )
  }

  /**
   * Persist the model to firebase.
   * @param  {Object} attributes  The attributes to override on the model.
   * @return {Promise}
   */
  create (attributes = {}) {
    return this.setAttributes(attributes).push(({ key }) => this.setKey(key))
  }

  /**
   * Persist a model to the database.
   * @return {Promise}
   */
  save () {
    return this.getKey() ? this.update() : this.push(({ key }) => this.setKey(key))
  }

  /**
   * Set the model's attributes to firebase.
   * @return {Promise}
   */
  async push (callback) {
    callback(await this.reference((ref, { attributes }) => {
      return ref.push(attributes)
    }))

    return this
  }

  /**
   * Set the model's attributes to firebase.
   * @return {Promise}
   */
  async update (callback) {
    callback(await this.reference((ref, { id, attributes }) => {
      return ref.child(id).set(attributes)
    }))

    return this
  }

  /**
   * Fill the model with attributes.
   * @type {Object}  attributes  The attributs to fill on the model.
   * @return {Model}  The current model.
   */
  fill (attributes = {}) {
    return this.setAttributes(attributes)
  }

  /**
   * Set the attributes on the model.
   * @param {Object} attributes [description]
   * @return {Model}  The current model.
   */
  setAttributes (attributes = {}) {
    this[_attributes] = Object.assign(this[_attributes] || {}, attributes)

    return this
  }

  /**
   * Set the location of the model.
   * @param {string} location
   */
  setLocation (location) {
    this[_location] = location
  }

  /**
   * Return the model's location
   * @return {string}
   */
  getLocation () {
    return this[_location]
  }

  /**
   * Set the key on the model.
   * @param {string} key
   */
  setKey (key) {
    return this[_key] = key
  }

  /**
   * Return the key of the model.
   * @return {string}
   */
  getKey () {
    return this[_key]
  }

  /**
   * Returns a reference to the location of the model or executes a provided callback
   * with the reference and model is it's two arguments.
   * @param  {Function} callback  A callback with the reference and model.
   * @return {mixed}  The result of the callback or a firebase reference to the model.
   */
  reference (callback) {
    let ref = firebase.database().ref(this.location)
    
    return callback ? callback(ref, this) : ref
  }

  /**
   * Pipe a callback or object 
   * @param  {mixed} mixed  A callback or object.
   * @return {mixed}  The return value of the callback or the object.
   */
  pipe (mixed) {
    if (typeof mixed === 'function') {
      return mixed(this)
    }

    return mixed
  }
}