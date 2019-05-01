const util = require('util')

const flatten = (obj, progress, path=null) => {
  Object.keys(obj).forEach(key => {
    let parentPath = path ? path.concat('.', key) : key

    if (isPrimary(obj[key])) { 
      progress[parentPath] = obj[key]
    } else {
      flatten(obj[key], progress, parentPath)
    }
  })
}

const isPrimary = obj => {
  if (typeof obj === 'object') {
    return util.isArray(obj) ||
      util.isDate(obj)
  }

  return true
}

module.exports = obj => {
  let converted = {}

  flatten(obj, converted)

  return converted
}