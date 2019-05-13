const { Document } = require('mushimas-models')

const PARENT_PATH = '@document'

const extractDoc = (doc, projection) => {
  let systemFields = {
    '@state': doc['@state'],
    '@version': doc['@version'],
    '@lastModified': doc['@lastModified'],
    '@lastCommitted': doc['@lastCommitted']
  }

  return Object.keys(projection).reduce((result, field) => {
    if (projection[field] === 1) {
      result[field] = doc[PARENT_PATH][field]
    }

    return result
  }, systemFields)
}

module.exports = async ({environment, projection, _id, client}) => {
  const { bucket, collection } = environment
  let doc = await Document.findOne({ _id, '@collectionId': collection.id, '@bucketId': bucket.id }).lean()

  await client.update({
    index: `${bucket.id}_${collection.id}`,
    type: `${bucket.id}_${collection.id}`,
    id: _id,
    body: {
      doc: extractDoc(doc, projection),
      doc_as_upsert: true
    }
  })
}
