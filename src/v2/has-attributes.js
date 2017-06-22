module.exports = class HasAttributes {
  /**
   * Convert the model's attributes to json.
   *
   * @return array
   */
  attributesToJson ()
  {
      // If an attribute is a date, we will cast it to a string after converting it
      // to a DateTime / Carbon instance. This is so we will get some consistent
      // formatting while accessing attributes vs. arraying / JSONing a model.
      attributes = this.addDateAttributesToJson(
          attributes = this.getJsonableAttributes()
      );

      attributes = this.addMutatedAttributesToJson(
          attributes, mutatedAttributes = this.getMutatedAttributes()
      );

      // Next we will handle any casts that have been setup for this model and cast
      // the values to their appropriate type. If the attribute has a mutator we
      // will not perform the cast on those attributes to avoid any confusion.
      attributes = this.addCastAttributesToJson(
          attributes, mutatedAttributes
      );

      // Here we will grab all of the appended, calculated attributes to this model
      // as these attributes are not really in the attributes array, but are run
      // when we need to array or JSON the model for convenience to the coder.
      this.getJsonableAppends().forEach(key => {
          attributes[key] = this.mutateAttributeForJson(key, null);
      })

      return attributes;
  }

  /**
   * Get an attribute from the model.
   * @param  {string} key
   * @return {mixed}
   */
  getAttribute (key) {
    if (! key) {
        return;
    }

    // If the attribute exists in the attribute array or has a "get" mutator we will
    // get the attribute's value. Otherwise, we will proceed as if the developers
    // are asking for a relationship's value. This covers both types of values.
    if (this.attributes[key] !== undefined || this.hasGetMutator(key)) {
        return this.getAttributeValue(key);
    }

    // Here we will determine if the model base class itself contains this given key
    // since we do not want to treat any of those methods as relationships since
    // they are all intended as helper methods and none of these are relations.
    if (this[key] === 'function') {
        return;
    }

    return this.getRelationValue(key);
  }

  setAttribute (key, value) {

  }

  getAttributes () {

  }

  getOriginalAttributes () {

  }

  getAttributeValue (key) {

  }

  hasGetMutator (key) {

  }

  hasSetMutator (key) {

  }

  setDateFormat (format) {

  }

  isDirty (attributes) {

  }

  isClean (attributes) {

  }

  getDirty () {

  }

  getFillable () {

  }

  isFillable (key) {

  }
}