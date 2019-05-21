const { getFlatDoc, deriveArgs, constructParams, getResults } = require('./utils')

module.exports = async ({ environment, args }) => {
  const { bucket, collection } = environment
  const { _options: options } = args
  let finalArgs = {
    ...getFlatDoc(deriveArgs(args, false)),
    '@collectionId': collection.id,
    '@bucketId': bucket.id
  }

  finalArgs = args._id ? { ...finalArgs, _id: args._id } : finalArgs

  const { query, sort, limit, paginatedField, paginate } = constructParams(finalArgs, options)

  return await getResults(query, sort, limit, paginatedField, paginate)
}