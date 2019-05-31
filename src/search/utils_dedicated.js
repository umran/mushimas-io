const PARENT_PATH = '@document'
const DEFAULT_LIMIT = 20
const DEFAULT_SORT_DIRECTION = 'desc'
const DEFAULT_PAGINATED_FIELD = '_score'
const FALLBACK_PAGINATED_FIELD = '_id'
const DEFAULT_MATCH_FIELDS = []
const DEFAULT_PAGINATE_VALUE = true
const STATE_FILTER = {
  term: {
    '@state': 'PUBLISHED'
  }
}

const findIndex = (arr, lambda) => {
  for (var i = 0; i < arr.length; i++) {
    if (lambda(arr[i]) === true) {
      return i
    }
  }

  return null
}

const inferSortDirection = sortDirection => sortDirection === -1 ? 'desc' : 'asc'

const inferSort = (field, direction) => {
  let result = [{
    [field]: direction
  }]

  if (field !== FALLBACK_PAGINATED_FIELD) {
    result = [
      ...result,
      {
        [FALLBACK_PAGINATED_FIELD]: DEFAULT_SORT_DIRECTION
      }
    ]
  }

  return result
}

const lookupIds = async (environment, _ids) => {

  const docs = await _findByIdList(environment, { _id: { $in: _ids }, _options: { paginate: false } })

  let sorted = []
  for (let i = 0; i < _ids.length; i++) {
    let index = findIndex(docs.results, doc => {
      return (doc._id === _ids[i])
    })

    if (index !== null) {
      sorted.push(docs.results[index])
    }
  }

  return sorted
}

const createBody = (query, options) => {
  if (!options) {
    return {
      query: {
        bool: {
          must: {
            simple_query_string: {
              query: query,
              fields: DEFAULT_MATCH_FIELDS
            }
          },
          filter: STATE_FILTER
        }
      },
      sort: inferSort(DEFAULT_PAGINATED_FIELD, DEFAULT_SORT_DIRECTION),
      size: DEFAULT_LIMIT + 1
    }
  }

  // destructure options
  const { paginate, paginatedField, sortDirection, limit, cursor, matchFields } = options

  // construct body according to search options
  let body = {
    query: {
      bool: {
        must: {
          simple_query_string: {
            query: query,
            fields: DEFAULT_MATCH_FIELDS
          }
        },
        filter: STATE_FILTER
      }
    },
    sort: inferSort(paginatedField || DEFAULT_PAGINATED_FIELD,
      sortDirection ? inferSortDirection(sortDirection) : DEFAULT_SORT_DIRECTION)
  }
  
  if (cursor && (!paginatedField || paginatedField !== FALLBACK_PAGINATED_FIELD)) {
    body = {
      ...body,
      search_after: cursor.split('_')
    }
  } else if (cursor) {
    body = {
      ...body,
      search_after: [cursor]
    }
  }

  if (paginate !== false) {
    body = {
      ...body,
      size: (limit || DEFAULT_LIMIT) + 1
    }
  }

  return body
}

const hydrateResults = async (environment, results, options={}) => {
  const { paginate, paginatedField, limit } = options
  const _limit = limit || DEFAULT_LIMIT

  if (!results.hits || !results.hits.hits || results.hits.hits.length === 0) {
    return {
      results: [],
      cursor: null
    }
  }

  let nextCursor
  if (paginate !== false && results.hits.hits.length > _limit) {
    results.hits.hits.pop()

    const cursorElement = results.hits.hits[results.hits.hits.length - 1]

    if (paginatedField && paginatedField === FALLBACK_PAGINATED_FIELD) {
      nextCursor = `${cursorElement[FALLBACK_PAGINATED_FIELD]}`
    } else if (paginatedField) {
      nextCursor = `${cursorElement['_source'][paginatedField]}_${cursorElement[FALLBACK_PAGINATED_FIELD]}`
    } else {
      nextCursor = `${cursorElement['_score']}_${cursorElement[FALLBACK_PAGINATED_FIELD]}`
    }
  }

  let hydrated = await lookupIds(environment, results.hits.hits.map(hit => hit._id))

  return {
    results: hydrated,
    cursor: nextCursor
  }
}

const extractDoc = (doc, projection) => {
  let systemFields = {
    '@state': doc['@state'],
    '@lastModified': doc['@lastModified']
  }

  return Object.keys(projection).reduce((result, field) => {
    if (projection[field] === 1) {
      result[field] = doc[PARENT_PATH][field]
    }

    return result
  }, systemFields)
}

module.exports = {
  createBody,
  hydrateResults,
  extractDoc
}