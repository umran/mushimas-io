const find = require('../database/find')

const DEFAULT_LIMIT = 20

const createBody = (query, options={}) => {
  let _limit = DEFAULT_LIMIT
  let _sortDirection = 'desc'
  let _paginatedField = '_score'
  let _matchFields = []
  let _sort

  const { paginate, paginatedField, sortDirection, limit, cursor, matchFields } = options

  if (sortDirection) {
    _sortDirection = sortDirection === 1 ? 'asc' : 'desc'
  }

  if (limit) {
    _limit = limit
  }

  if (paginatedField) {
    _paginatedField = paginatedField
  }

  if (matchFields) {
    _matchFields = matchFields
  }

  if (!paginatedField || paginatedField !== '_id') {
    _sort = [
      { [_paginatedField]: _sortDirection },
      { _id: 'desc' }
    ]
  } else {
    _sort = [
      { [_paginatedField]: _sortDirection }
    ]
  }

  let body = {
    query: {
      simple_query_string: {
        query: query,
        fields: _matchFields
      }
    },
    sort: _sort
  }

  if (cursor && (!paginatedField || paginatedField !== '_id')) {
    body.search_after = cursor.split('_')
  } else if (cursor) {
    body.search_after = [cursor]
  }

  if (paginate !== false) {
    body.size = _limit + 1
  }

  return body
}

const hydrateResults = async (model, results, options={}) => {
  const { paginate, paginatedField, limit } = options
  let _limit = limit || DEFAULT_LIMIT

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

    if (paginatedField && paginatedField === '_id') {
      nextCursor = `${cursorElement['_id']}`
    } else if (paginatedField) {
      nextCursor = `${cursorElement['_source'][paginatedField]}_${cursorElement['_id']}`
    } else {
      nextCursor = `${cursorElement['_score']}_${cursorElement['_id']}`
    }
  }

  let hydrated = await lookupIds(results.hits.hits.map(hit => hit._id), model)

  return {
    results: hydrated,
    cursor: nextCursor
  }
}

const lookupIds = async (_ids, model) => {

  let docs = await find(model, { _id: { $in: _ids }, _options: { paginate: false } })

  let sorted = []
  for (var i = 0; i < _ids.length; i++) {
    let index = findIndex(docs.results, doc => {
      return (doc._id === _ids[i])
    })

    if (index !== null) {
      sorted.push(docs.results[index])
    }
  }

  return sorted
}

const findIndex = (arr, lambda) => {
  for (var i = 0; i < arr.length; i++) {
    if (lambda(arr[i]) === true) {
      return i
    }
  }

  return null
}

module.exports = async ({modelKey, model, args, client}) => {
  const { query, _options: options } = args

  let results = await client.search({
    index: modelKey,
    type: modelKey,
    body: createBody(query, options)
  })

  return await hydrateResults(model, results, options)
}
