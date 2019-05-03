const model = require('../model')

const { formatResult, deriveArgs } = require('./utils')

const PARENT_PATH = '@document'
const DEFAULT_LIMIT = 20
const DEFAULT_SORT_DIRECTION = -1
const DEFAULT_PAGINATED_FIELD = '_id'
const DEFAULT_PAGINATE_VALUE = true

const inferSortOperator = sortDirection => sortDirection === -1 ? '$lt' : '$gt'

const getFullPath = partial => partial === '_id' ? partial : PARENT_PATH.concat('.', partial)

const inferSort = (field, direction) => {
  let result = {
    [getFullPath(field)]: direction
  }

  if (field !== DEFAULT_PAGINATED_FIELD) {
    result = {
      ...result,
      [getFullPath(DEFAULT_PAGINATED_FIELD)]: DEFAULT_SORT_DIRECTION
    }
  }

  return result
}

const getCursor = (cursorElement, path) => {
  let unrolledPath = path.split('.')
  let nextLevel = cursorElement

  unrolledPath.forEach(level => {
    nextLevel = nextLevel[level]
  })

  return nextLevel
}

const constructParams = (args, options) => {
  if (!options) {
    return {
      query: args,
      sort: inferSort(DEFAULT_PAGINATED_FIELD, DEFAULT_SORT_DIRECTION),
      limit: DEFAULT_LIMIT,
      paginatedField: DEFAULT_PAGINATED_FIELD,
      paginate: DEFAULT_PAGINATE_VALUE
    }
  }

  // destructure options
  const { paginate, paginatedField, sortDirection, limit, cursor } = options

  // set sort operator
  const sortOperator = inferSortOperator(sortDirection || DEFAULT_SORT_DIRECTION)

  // build query based on whether a cursor is provided
  let query
  
  if (cursor && paginatedField && paginatedField !== DEFAULT_PAGINATED_FIELD) {
    const [cursor_primary, cursor_secondary] = cursor.split('_')

    query = {
      $and: [args, {
        $or: [{
          [getFullPath(paginatedField)]: { [sortOperator]: cursor_primary }
        },
        {
          [getFullPath(paginatedField)]: cursor_primary,
          [getFullPath(DEFAULT_PAGINATED_FIELD)]: { [inferSortOperator(DEFAULT_SORT_DIRECTION)]: cursor_secondary }
        }]
      }]
    }

  } else if (cursor) {
    query = {
      $and: [args, {
        [getFullPath(DEFAULT_PAGINATED_FIELD)]: { [sortOperator]: cursor }
      }]
    }
  } else {
    query = args
  }

  return {
    query,
    sort: inferSort(paginatedField || DEFAULT_PAGINATED_FIELD,
      sortDirection || DEFAULT_SORT_DIRECTION),
    limit: limit || DEFAULT_LIMIT,
    paginatedField: paginatedField || DEFAULT_PAGINATED_FIELD,
    paginate: typeof paginate !== 'undefined' ? paginate : DEFAULT_PAGINATE_VALUE
  }
}

const getResults = async (query, sort, limit, paginatedField, paginate) => {
  let results
  
  if (paginate === true) {
    results = formatResult(await model.find(query).sort(sort).limit(limit + 1).lean())
  } else {
    results = formatResult(await model.find(query).sort(sort).lean())
  }

  let nextCursor
  
  if (paginate === true && results.length > limit) {
    results.pop()

    const cursorElement = results[results.length - 1]

    if (paginatedField && paginatedField !== DEFAULT_PAGINATED_FIELD) {
      nextCursor = `${getCursor(cursorElement, paginatedField)}_${getCursor(cursorElement, DEFAULT_PAGINATED_FIELD)}`
    } else {
      nextCursor = `${getCursor(cursorElement, DEFAULT_PAGINATED_FIELD)}`
    }
  }

  return {
    results,
    cursor: nextCursor
  }
}

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