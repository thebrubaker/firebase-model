module.exports = class HasRelationships {
  hasOne (related, foreignKey, localKey) {

  }

  morphOne (related, name, type, id, localKey) {

  }

  belongsTo (related, foreignKey, localKey) {

  }

  morphTo (name, type, id) {

  }

  hasMany (related, foreignKey, localKey) {

  }

  hasManyThrough (related, through, firstKey, secondKey, localKey) {

  }

  morphMany (related, name, type, id, localKey) {

  }

  belongsToMany (related, table, foreignKey, relatedKey, relation) {

  }

  morphToMany (related, name, table, foreignKey, relatedKey, inverse) {

  }

  morphedByMany (related, name, table, foreignKey, relatedKey) {

  }
}