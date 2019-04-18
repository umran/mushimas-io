const { formatResult, deriveArgs } = require('./utils')

const DEFAULT_LIMIT = 20
const DEFAULT_SORT_DIRECTION = -1
const DEFAULT_PAGINATED_FIELD = '_id'
const DEFAULT_PAGINATE_VALUE = true

const inferSortOperator = sortDirection => sortDirection === -1 ? '$lt' : '$gt'

const inferSort = (field, direction) => {
  let result = {
    [field]: direction
  }

  if (field !== DEFAULT_PAGINATED_FIELD) {
    result = {
      ...result,
      [DEFAULT_PAGINATED_FIELD]: DEFAULT_SORT_DIRECTION
    }
  }

  return result
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
          [paginatedField]: { [sortOperator]: cursor_primary }
        },
        {
          [paginatedField]: cursor_primary,
          [DEFAULT_PAGINATED_FIELD]: { [inferSortOperator(DEFAULT_SORT_DIRECTION)]: cursor_secondary }
        }]
      }]
    }

  } else if (cursor) {
    query = {
      $and: [args, {
        [DEFAULT_PAGINATED_FIELD]: { [sortOperator]: cursor }
      }]
    }
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

const getResults = async (model, query, sort, limit, paginatedField, paginate) => {
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
      nextCursor = `${cursorElement[paginatedField]}_${cursorElement[DEFAULT_PAGINATED_FIELD]}`
    } else {
      nextCursor = `${cursorElement[DEFAULT_PAGINATED_FIELD]}`
    }
  }

  return {
    results,
    cursor: nextCursor
  }
}

module.exports = async (model, args) => {
  const { _options: options } = args
  const derivedArgs = deriveArgs(args)

  const { query, sort, limit, paginatedField, paginate } = constructParams(derivedArgs, options)

  return await getResults(model, query, sort, limit, paginatedField, paginate)
}