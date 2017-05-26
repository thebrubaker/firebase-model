const { _key, _attributes, _location, _config } = require('./symbols')
const firebase = require('./firebase')
const HasMany = require('./has-many')

/**
 * 
 */
module.exports = class Model {
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
    this.setConfig(this)
    this.setAttributes(attributes)

    return new Proxy(this, this)
  }

  /**
   * Set the configuration for the model.
   * @param {Model} model
   */
  setConfig ({ location = '/', embeds = [], fillable = [] }) {
    this[_config] = { location, embeds, fillable }
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
   * Return the model's attributes as JSON.
   * @return {string}
   */
  data () {
    return Object.assign(this[_attributes], { key: this.getKey() })
  }

  /**
   * Return the model's attributes as JSON.
   * @return {string}
   */
  json () {
    return JSON.stringify(this.data())
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
  async save () {
    return this.getKey() ? await this.update() : await this.push(({ key }) => this.setKey(key))
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
   * Return the model's attributes
   * @return {Object}
   */
  getAttributes () {
    return this[_attributes]
  }

  /**
   * Set the location of the model.
   * @param {string} location
   */
  setLocation (location) {
    this.getConfig()['location'] = location
  }

  /**
   * Return the model's location
   * @return {string}
   */
  getLocation () {
    return this.getConfig('location')
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
  reference (callback = null) {
    let ref = firebase.database().ref(this.getLocation())
    
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

  /**
   * Return a HasMany relationship on the model.
   * @param  {Model}  Model
   * @return {HasMany}
   */
  hasMany (Model) {
    return new HasMany(this, Model)
  }

  /**
   * Load all relations on the model.
   * @return {[type]} [description]
   */
  async loadRelations () {
    this.getRelations(relation => {
      Object.keys(this[relation]).forEach(async key => {
        this[relation][key] = await this[_config][relation]().fetchRelation(key)
      })
    })
  }

  /**
   * For each relation that should be embedded in the model,
   * execute the callback on the name of the embedded relation.
   * @param  {Function} callback  The callback with the relation as an argument.
   */
  getRelations (callback) {
    Object.keys(this.getAttributes()).forEach(key => {
      if (this.shouldEmbed(key)) {
        callback(key)
      }
    })
  }

  /**
   * Determine if the given key is defined on the model's
   * embeds array.
   * @param  {string} key
   * @return {boolean}
   */
  shouldEmbed (key) {
    return this.getEmbeds(key) !== undefined
  }

  /**
   * Return the model's configuratiion or a specific key
   * from the configuration of the model.
   * @param  {string|null} key
   * @return {mixed}
   */
  getConfig (key = null) {
    return key ? this[_config][key] : this[_config]
  }

  /**
   * Return a list of the model's embeds or a specific key on the embeds list.
   * @param  {string|null} key
   * @return {mixed}
   */
  getEmbeds (key = null) {
    return key ? this.getConfig('embeds')[key] : this.getConfig('embeds')
  }
}