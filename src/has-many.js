const firebase = require('./firebase')

module.exports = class HasMany {
  /**
   * The constructor for the class.
   * @param  {Model} parent  An instance of the parent model.
   * @param  {Function} Child  The class of the child model.
   * @return {HasMany}
   */
  constructor (parent, Child) {
    this.parent = parent
    this.Child = Child
  }

  /**
   * Return a new instance of the child model.
   * @param  {Object} attributes
   * @return {Model}
   */
  newChild (attributes = {}) {
    return new this.Child(attributes)
  }

  /**
   * Fetch a specific child from the database.
   * @param  {string} key [description]
   * @return {[type]}     [description]
   */
  async fetchRelation (key) {
    let child = this.newChild()
    let snapshot = await firebase.database().ref(child.getLocation()).child(key).once('value')
    child.fill(snapshot.val())
    child.setKey(key)
    
    return child
  }

  /**
   * Return a reference from firebase. The arguments map to nested
   * references on the database.
   * @param  {...String} args  The nested references on the database.
   * @return {Promise}
   */
  once (...args) {
    return args.reduce((ref, arg) => {
      return ref.child(arg)
    }, firebase.database().ref()).once('value')
  }
}