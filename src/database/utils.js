const PARENT_PATH = '@document'

const extractDoc = doc => {
  return {
    ...doc[PARENT_PATH],
    _id: doc._id.toString()
  }
}

exports.formatResult = (result) => {
  if (Array.isArray(result)) {
    return result.map(res => extractDoc(res))
  } else if (result) {
    return extractDoc(result)
  }
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