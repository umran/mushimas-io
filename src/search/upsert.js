const { Document } = require('mushimas-models')

module.exports = client => async ({ environment, args }) => {
  const { bucket, collection } = environment
  const { projection, _id } = args
  
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
