const _findByIdList = require('../database/_findByIdList')
const { findIndex } = require('./utils')
const { validatePaginatedField, validateMatchFields } = require('../validators')

const { ObjectId } = require('mongoose').Types

const PARENT_PATH = '@document'

const DEFAULT_LIMIT = 20
const DEFAULT_SORT_DIRECTION = 'desc'
const DEFAULT_PAGINATED_FIELD = '_score'
const FALLBACK_PAGINATED_FIELD = '_id'
const DEFAULT_MATCH_FIELDS = []
const DEFAULT_PAGINATE_VALUE = true

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

const extractDoc = doc => {
  return {
    ...doc[PARENT_PATH],
    _id: doc._id.toString()
  }
}

const lookupIds = async (context, _ids) => {

  const docs = await _findByIdList(context, { _id: { $in: _ids }, _options: { paginate: false } })

  let sorted = []
  for (var i = 0; i < _ids.length; i++) {
    let index = findIndex(docs.results, doc => {
      return (doc._id === _ids[i])
    })

    if (index !== null) {
      sorted.push(extractDoc(docs.results[index]))
    }
  }

  return sorted
}

const createBody = (query, options) => {
  if (!options) {
    return {
      query: {
        query_string: {
          query: query,
          fields: DEFAULT_MATCH_FIELDS
        }
      },
      sort: inferSort(DEFAULT_PAGINATED_FIELD, DEFAULT_SORT_DIRECTION)
    }
  }

  // destructure options
  const { paginate, paginatedField, sortDirection, limit, cursor, matchFields } = options

  // construct body according to search options
  let body = {
    query: {
      query_string: {
        query: query,
        fields: matchFields || DEFAULT_MATCH_FIELDS
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

const hydrateResults = async (context, results, options={}) => {
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

  let hydrated = await lookupIds(context, results.hits.hits.map(hit => ObjectId(hit._id)))

  return {
    results: hydrated,
    cursor: nextCursor
  }
}

module.exports = async ({context, args, schemas, client}) => {
  const { bucket, collection } = context
  const { query, _options: options } = args

  // validate user options
  if (options) {
    if (options.paginatedField) {
      validatePaginatedField(options.paginatedField, collection, schemas)
    }

    if (options.matchFields) {
      validateMatchFields(options.matchFields, collection, schemas)
    }
  }

  let results = await client.search({
    index: `${bucket}_${collection}`,
    type: `${bucket}_${collection}`,
    body: createBody(query, options)
  })

  return await hydrateResults(context, results, options)
}