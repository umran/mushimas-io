const model = require('../model')

const PARENT_PATH = '@document'

const convertProjection = projection => {
  return Object.keys(projection).reduce((converted, key) => {
    converted[`${PARENT_PATH}.${key}`] = projection[key]

    return converted
  }, {})
}

module.exports = async ({context, projection, _id, client}) => {
  const { bucket, collection } = context
  let doc = await model.findOne({ _id, '@collection': collection, '@bucket': bucket }, { ...convertProjection(projection), _id: 0 }).lean()

  await client.update({
    index: `${bucket}_${collection}`,
    type: `${bucket}_${collection}`,
    id: _id,
    body: {
      doc,
      doc_as_upsert: true
    }
  })
}
