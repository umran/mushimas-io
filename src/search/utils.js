const handleObject = obj => {
  return Object.keys(obj)
    .reduce((output, key) => {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (Array.isArray(obj[key])) {
          output = output.concat(handleArray(obj[key]))
        } else if (Object.prototype.toString.call(obj[key]) === '[object Date]') {
          output = output.concat(obj[key].toISOString())
        } else {
          output = output.concat(handleObject(obj[key]))
        }
      } else {
        output = output.concat(obj[key].toString())
      }

      return output
    }, [])
}

const handleArray = arr => {
  return arr.reduce((output, item) => {
    if (typeof item === 'object' && item !== null) {
      output = output.concat(handleObject(item))
    } else {
      output = output.concat(item.toString())
    }

    return output
  }, [])
}

const getFullText = doc => {
  return handleObject(doc)
}

const extractDoc = doc => ({
  '@collectionId': doc['@collectionId'],
  '@bucketId': doc['@bucketId'],
  '@state': doc['@state'],
  '@draftPublished': doc['@draftPublished'],
  '@lastModified': doc['@lastModified'],
  '@draft': getFullText(doc['@draft']),
  '@document': getFullText(doc['@document'])
})

module.exports = {
  extractDoc
}