const model = require('../model')
const { formatResult } = require('./utils')

const PARENT_PATH = '@document'

module.exports = async ({environment, args}) => {
  const { bucket, collection } = environment

  const finalArgs = {
    ...args,
    '@collectionId': collection.id,
    '@bucketId': bucket.id
  }

  return formatResult(await model.findOne(finalArgs).lean())
}
