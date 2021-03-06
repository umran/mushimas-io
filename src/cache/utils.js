const { generateHash } = require('mushimas-crypto')

const handleObject = obj => {
  return Object.keys(obj)
    .sort()
    .reduce((output, key) => {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (Array.isArray(obj[key])) {
          output = output.concat(key).concat(handleArray(obj[key]))
        } else if (Object.prototype.toString.call(obj[key]) === '[object Date]') {
          output = output.concat(key).concat(obj[key].toISOString())
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

const generateKey = (method, bucketId, collectionId, query) => {
  let material = handleObject(query)
  let hash = generateHash(material)

  return `${method}.${bucketId}.${collectionId}.${hash}`
}

const getKeys = client => (method, bucketId, collectionId) => new Promise((resolve, reject) => {
  let keys = []

  const stream = client.scanStream({
    match: `${method}.${bucketId}.${collectionId}.*`
  })

  stream.on('data', resultKeys => {
    keys = keys.concat(resultKeys)
  })

  stream.on('end', () => {
    resolve(keys)
  })

  stream.on('error', (err) => {
    reject(err)
  })
})

module.exports = {
  generateKey,
  getKeys
}