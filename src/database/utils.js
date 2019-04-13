exports.formatResult = (result) => {
  if (Array.isArray(result)) {
    result = result.map(res => {
      res._id = res._id.toString()
      return res
    })
  } else if (result) {
    result._id = result._id.toString()
  }

  return result
}

exports.deriveArgs = args => {
  return Object.keys(args).filter(argKey => argKey !== '_options').reduce((accumulator, argKey) => {
    accumulator[argKey] = args[argKey]

    return accumulator
  }, {})
}

exports.filterUpdates = args => {
  return Object.keys(args).filter(key => (key !== '_id')).reduce((filtered, key) => {
    filtered[key] = args[key]
    return filtered
  }, {})
}