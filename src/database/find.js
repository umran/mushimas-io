const { formatResult, deriveArgs } = require('./utils')

const DEFAULT_LIMIT = 20

module.exports = async ({model, argsOptions}) => {

  const { _options: options } = argsOptions
  const args = deriveArgs(argsOptions)

  let _query = args
  let _limit = DEFAULT_LIMIT
  let _sortDirection = -1
  let _sortOperator = '$lt'

  let _sort = {
    _id: _sortDirection
  }

  if (!options) {
    return await getResults(model, _query, _sort, _limit, '_id')
  }

  const { paginate, paginatedField, sortDirection, limit, cursor } = options

  if (sortDirection && sortDirection === 1) {
    _sortOperator = '$gt'
    _sortDirection = 1
  }

  if (cursor && paginatedField && paginatedField !== '_id') {
    const [cursor_primary, cursor_secondary] = cursor.split('_')

    _query = {
      $and: [args, {
        $or: [{
          [paginatedField]: { [_sortOperator]: cursor_primary }
        },
        {
          [paginatedField]: cursor_primary,
          _id: { $lt: cursor_secondary }
        }]
      }]
    }
  } else if (cursor) {
    _query = {
      $and: [args, {
        _id: { [_sortOperator]: cursor }
      }]
    }
  }

  if (paginatedField && paginatedField !== '_id') {
    _sort = {
      [paginatedField]: _sortDirection,
      _id: -1
    }
  } else {
    _sort = {
      _id: _sortDirection
    }
  }

  if (limit) {
    _limit = limit
  }

  return await getResults(model, _query, _sort, _limit, paginatedField, paginate)
}

const getResults = async (model, _query, _sort, _limit, paginatedField, paginate = true) => {
  let results
  if (paginate === true) {
    results = formatResult(await model.find(_query).sort(_sort).limit(_limit + 1).lean())
  } else {
    results = formatResult(await model.find(_query).sort(_sort).lean())
  }

  let nextCursor
  if (paginate !== false && results.length > _limit) {
    results.pop()

    const cursorElement = results[results.length - 1]

    if (paginatedField && paginatedField !== '_id') {
      nextCursor = `${cursorElement[paginatedField]}_${cursorElement['_id']}`
    } else {
      nextCursor = `${cursorElement['_id']}`
    }
  }

  return {
    results,
    cursor: nextCursor
  }
}
