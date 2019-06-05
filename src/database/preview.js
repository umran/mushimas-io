const { getFlatDraft, deriveArgs, constructParams, getResults } = require('./utils')

module.exports = async ({ environment, args }) => {
  const { bucket, collection } = environment
  const { _options: options } = args
  let finalArgs = {
    ...getFlatDraft(deriveArgs(args, false)),
    '@collectionId': collection.id,
    '@bucketId': bucket.id,
    '@state': { $ne: 'DELETED' }
  }

  finalArgs = args._id ? { ...finalArgs, _id: args._id } : finalArgs

  const { query, sort, limit, paginatedField, paginate } = constructParams(finalArgs, options, true)

  return await getResults(query, sort, limit, paginatedField, paginate, true)
}