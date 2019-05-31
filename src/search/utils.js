const _findByIdList = require('../database/_findByIdList')

const DEFAULT_LIMIT = 20
const MATCH_FIELDS = ['@document']
const SORT = [
  { '_score': 'desc' },
  { '_id': 'desc' }
]
const STATE_FILTER = {
  term: { '@state': 'PUBLISHED' }
}

const handleObject = obj => {
  return Object.keys(obj)
    .reduce((output, key) => {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (Array.isArray(obj[key])) {
          output = output.concat(handleArray(obj[key]))
        } else if (Object.prototype.toString.call(obj[key]) === '[object Date]') {
          output = output.concat(obj[key].toISOString())
        } else {
          output = output.concat(handleObject(obj[key]))
        }
      } else {
        output = output.concat(obj[key].toString())
      }

      return output
    }, [])
}

const handleArray = arr => {
  return arr.reduce((output, item) => {
    if (typeof item === 'object' && item !== null) {
      output = output.concat(handleObject(item))
    } else {
      output = output.concat(item.toString())
    }

    return output
  }, [])
}

const getFullText = doc => {
  return handleObject(doc)
}

const extractDoc = doc => ({
  '@collectionId': doc['@collectionId'],
  '@bucketId': doc['@bucketId'],
  '@state': doc['@state'],
  '@draftPublished': doc['@draftPublished'],
  '@lastModified': doc['@lastModified'],
  '@draft': getFullText(doc['@draft']),
  '@document': getFullText(doc['@document'])
})

const createBody = (environment, query, options) => {
  if (!options) {
    return {
      query: {
        bool: {
          must: {
            simple_query_string: {
              query: query,
              fields: MATCH_FIELDS
            }
          },
          filter: {
            term: { '@bucketId': environment.bucket.id }
          },
          filter: {
            term: { '@collectionId': environment.collection.id }
          },
          filter: STATE_FILTER
        }
      },
      sort: SORT,
      size: DEFAULT_LIMIT + 1
    }
  }

  // destructure options
  const { paginate, limit, cursor } = options

  // construct body according to search options
  let body = {
    query: {
      bool: {
        must: {
          simple_query_string: {
            query: query,
            fields: MATCH_FIELDS
          }
        },
        filter: {
          term: { '@bucketId': environment.bucket.id }
        },
        filter: {
          term: { '@collectionId': environment.collection.id }
        },
        filter: STATE_FILTER
      }
    },
    sort: SORT
  }
  
  if (cursor) {
    body = {
      ...body,
      search_after: cursor.split('_')
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

const hydrateResults = async (environment, results, options={}) => {
  const { paginate, limit } = options
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
    nextCursor = `${cursorElement['_score']}_${cursorElement[FALLBACK_PAGINATED_FIELD]}`
  }

  let hydrated = await lookupIds(environment, results.hits.hits.map(hit => hit._id))

  return {
    results: hydrated,
    cursor: nextCursor
  }
}

module.exports = {
  extractDoc,
  createBody,
  hydrateResults
}