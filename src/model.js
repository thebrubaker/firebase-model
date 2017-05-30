let { _key, _attributes, _location, _config } = require('./symbols')
let admin = require('firebase-admin')
let HasMany = require('./has-many')
let firebase = require('./firebase')

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
   * Initialize the firebase instance for the Model. Pass a callback the
   * receives firebase admin and returns a credentials object.
   * @param  {Function} callback The callback is passed firebase admin
   *                             and expects a return of credentials.
   */
  static init (callback) {
    firebase = admin.initializeApp(callback(admin))
  }

  /**
   * Set the configuration for the model.
   * @param {Model} model
   */
  setConfig (model) {
    this[_config] = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
      .filter(key => key !== 'constructor')
      .reduce((carry, key) => {
        carry[key] = this[key]
        return carry
      }, {})
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
    let data = Object.assign(this[_attributes], { key: this.getKey() })
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'object' && this[_config][key] !== undefined) {
        data[key] = Object.keys(data[key]).map(item => data[key][item].data())
      }
    })

    return data
  }

  /**
   * Return the model's attributes as JSON.
   * @return {string}
   */
  json () {
    return JSON.stringify(this.data())
  }

  /**
   * Return a model by it's key.
   * @param  {string} key
   * @return {Promise}
   */
  async fetch (key) {
    let snapshot = await this.reference().child(key).once('value')
    let model = this.newInstance(snapshot.val(), key)
    await Promise.all(model.loadRelations())

    return model
  }

  /**
   * Return a new instance of the model.
   * @return {Model}
   */
  newInstance (attributes = {}, key) {
    let model = Object.create(this)
    model.setAttributes(attributes)
    model.setKey(this.key || key)

    return model
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
    callback(this.reference(ref => {
      return ref.push(this.getAttributes())
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
   * Load all relations on the model. For each relation on
   * the model, we crawl the relation and fetch the items from it.
   * This returns an array of arrays, which we then flatten with concat.
   *   [ [ promise1, promise2 ], [ promise3, promise4 ] ] =>
   *   [ promise1, promise2, promise3, promise4 ]
   * @return {Array}  An array of promises fetching relations on the model.
   */
  loadRelations () {
    return this.iterateAllRelations((relation, key) => {
      return this.loadRelation(relation, key)
    }).reduce((a, b) => a.concat(b), [])
  }

  /**
   * Execute a callback on all items in all relations on this
   * model. The callback will receive the relation name and the
   * key of the relation.
   * @param  {Function} callback
   */
  iterateAllRelations (callback) {
    // console.log('iterateAllRelations called', callback)
    return this.getRelations(relation => {
      // console.log(relation, this[relation])
      return Object.keys(this[relation]).map(key => {
        // callback('charts', 'chart1')
        return callback(relation, key)
      })
    })
  }

  /**
   * Return the model's relations or execute a callback on each relation
   * in the model.
   * @param  {Function} callback  The callback with the relation as an argument.
   */
  getRelations (callback) {
    // console.log('getRelations called', callback)
    let filtered = Object.keys(this.getAttributes())
      .filter(key => this.shouldPopulate(key))
      // console.log(filtered)
      return filtered.map(key => callback ? callback(key) : key)
  }

  /**
   * Load a relation on the model.
   * @param  {string} relation  The name of the relation to load.
   * @param  {string} key  The key of the relation to load.
   * @return {Promise}          [description]
   */
  loadRelation (relation, key) {
    let promise = this[_config][relation].apply(this).fetchRelation(key)
    promise.then(model => {
      this[relation][key] = model
    })

    return promise
  }

  /**
   * Determine if the given key is defined on the model's
   * populate array.
   * @param  {string} key
   * @return {boolean}
   */
  shouldPopulate (key) {
    return this.getConfig('populate').includes(key)
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
}