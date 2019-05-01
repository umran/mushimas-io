const model = require('../model')

const PARENT_PATH = '@document'

const extractDoc = (doc, projection) => {
  return Object.keys(projection).reduce((result, field) => {
    if (projection[field] === 1) {
      result[field] = doc['@document'][field]
    }

    return result
  }, {})
}

module.exports = async ({context, projection, _id, client}) => {
  const { bucket, collection } = context
  let doc = await model.findOne({ _id, '@collection': collection, '@bucket': bucket }).lean()

  await client.update({
    index: `${bucket}_${collection}`,
    type: `${bucket}_${collection}`,
    id: _id,
    body: {
      doc: extractDoc(doc, projection),
      doc_as_upsert: true
    }
  })
}
