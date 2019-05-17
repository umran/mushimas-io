const { deriveArgs, constructParams, getResults } = require('./utils')

module.exports = async (environment, args) => {
  const { bucket, collection } = environment
  const { _options: options } = args
  const finalArgs = {
    ...deriveArgs(args),
    '@collectionId': collection.id,
    '@bucketId': bucket.id
  }

  const { query, sort, limit, paginatedField, paginate } = constructParams(finalArgs, options)

  return await getResults(query, sort, limit, paginatedField, paginate)
}