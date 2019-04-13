const { generateHash } = require('mushimas-crypto')

const handleObject = obj => {
  return Object.keys(obj)
    .sort()
    .reduce((output, key) => {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (Array.isArray(obj[key])) {
          output = output.concat(key).concat(handleArray(obj[key]))
        } else {
          output = output.concat(key).concat(handleObject(obj[key]))
        }
      } else {
        output = output.concat(key).concat(obj[key].toString())
      }

      return output
    }, "")
}

const handleArray = arr => {
  return arr.map((item, index) => {
    if (typeof item === 'object' && item !== null) {
      return handleObject(item)
    }

    return item.toString()
  })
    .sort()
    .join()
}

exports.generateKey = ({collection, args, method}) => {
  let material = handleObject(args)
  let hash = generateHash(material)

  return `${method}${collection}${hash}`
}