const { Document } = require('mushimas-models')
const flatten = require('../flatten')

const PARENT_PATH = '@document'
const DRAFT_PATH = '@draft'
const DEFAULT_LIMIT = 20
const DEFAULT_SORT_DIRECTION = -1
const DEFAULT_PAGINATED_FIELD = '_id'
const DEFAULT_PAGINATE_VALUE = true
const STATE_FILTER = 'PUBLISHED'

// committed methods
const extractDoc = doc => {
  return {
    ...doc[PARENT_PATH],
    _id: doc._id.toString()
  }
}

const formatResult = (result) => {
  if (Array.isArray(result)) {
    return result.map(res => extractDoc(res))
  } else if (result) {
    return extractDoc(result)
  }
}

const deriveArgs = (args, includeId=true) => {
  return Object.keys(args).filter(argKey => includeId ? (argKey !== '_options') : (argKey !== '_options' && argKey !== '_id')).reduce((accumulator, argKey) => {
    accumulator[argKey] = args[argKey]

    return accumulator
  }, {})
}

const filterUpdates = args => {
  return Object.keys(args).filter(key => (key !== '_id')).reduce((filtered, key) => {
    filtered[key] = args[key]
    return filtered
  }, {})
}

// new methods
const inferSortOperator = sortDirection => sortDirection === -1 ? '$lt' : '$gt'

const getFlatDoc = args => flatten({ [PARENT_PATH]: args })
const getFlatDraft = args => flatten({ [DRAFT_PATH]: args })

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
      query: { ...args, '@state': STATE_FILTER },
      sort: inferSort(DEFAULT_PAGINATED_FIELD, DEFAULT_SORT_DIRECTION),
      limit: DEFAULT_LIMIT,
      paginatedField: DEFAULT_PAGINATED_FIELD,
      paginate: DEFAULT_PAGINATE_VALUE,
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
      $and: [args, { '@state': STATE_FILTER }, {
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
      $and: [args, { '@state': STATE_FILTER }, {
        [getFullPath(DEFAULT_PAGINATED_FIELD)]: { [sortOperator]: cursor }
      }]
    }
  } else {
    query = { ...args, '@state': STATE_FILTER }
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
    results = formatResult(await Document.find(query).sort(sort).limit(limit + 1).lean())
  } else {
    results = formatResult(await Document.find(query).sort(sort).lean())
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

module.exports = {
  formatResult,
  deriveArgs,
  getFlatDoc,
  getFlatDraft,
  constructParams,
  getResults,
  filterUpdates
}