const { extractDoc } = require('./utils_dedicated')

module.exports = client => async ({ environment, args }) => {
  const { bucket, collection } = environment
  const { projection, document } = args
  
  const { _id } = document

  await client.update({
    index: `${bucket.id}_${collection.id}`,
    type: `${bucket.id}_${collection.id}`,
    id: _id,
    body: {
      doc: extractDoc(document, projection),
      doc_as_upsert: true
    }
  })
}
