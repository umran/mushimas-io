const expect = require('chai').expect
const { createBody } = require('../src/search/utils')

// declare constants
const PARENT_PATH = '@document'
const DEFAULT_LIMIT = 20
const DEFAULT_SORT_DIRECTION = 'desc'
const DEFAULT_PAGINATED_FIELD = '_score'
const FALLBACK_PAGINATED_FIELD = '_id'
const DEFAULT_MATCH_FIELDS = []
const DEFAULT_PAGINATE_VALUE = true

const query = 'someQuery'

describe('search.utils.createBody()', () => {

  it('returns the default parameters when no options are provided, ', () => {
    const expectedSort = [
      { [DEFAULT_PAGINATED_FIELD]: DEFAULT_SORT_DIRECTION },
      { [FALLBACK_PAGINATED_FIELD]: DEFAULT_SORT_DIRECTION }
    ]
    const expectedResults = {
      query: {
        query_string: {
          query: query,
          fields: DEFAULT_MATCH_FIELDS
        }
      },
      sort: expectedSort,
      size: DEFAULT_LIMIT + 1
    }

    const results = createBody(query)

    expect(results).to.deep.equal(expectedResults)
  })

  // test search_after object
  it('returns a compound search_after object when a cursor is provided and either no paginatedField is provided or the paginatedField is not the fallback field', () => {
    const optionsA = {
      paginatedField: 'someField',
      cursor: 'someValue_5cdd2b7776ce1b8a0e379e46'
    }

    const optionsB = {
      cursor: 'someValue_5cdd2b7776ce1b8a0e379e46'
    }

    const expectedSearchAfter = ['someValue', '5cdd2b7776ce1b8a0e379e46']

    const resultsA = createBody(query, optionsA)
    const resultsB = createBody(query, optionsB)

    expect(resultsA.search_after).to.deep.equal(expectedSearchAfter)
    expect(resultsB.search_after).to.deep.equal(expectedSearchAfter)
  })

  it('returns a search_after object with one argument when a cursor is provided and the paginatedField is the fallback field', () => {
    const options = {
      paginatedField: '_id',
      cursor: '5cdd2b7776ce1b8a0e379e46'
    }

    const expectedSearchAfter = ['5cdd2b7776ce1b8a0e379e46']

    const results = createBody(query, options)

    expect(results.search_after).to.deep.equal(expectedSearchAfter)
  })

  // test sort object
  it('returns a compound sort object with the primary sort set to paginaedField when a paginatedField is provided and paginatedField is not the fallback field', () => {
    const options = {
      paginatedField: 'someField'
    }

    const expectedSort = [
      { ['someField']: DEFAULT_SORT_DIRECTION },
      { [FALLBACK_PAGINATED_FIELD]: DEFAULT_SORT_DIRECTION }
    ]

    const results = createBody(query, options)

    expect(results.sort).to.deep.equal(expectedSort)
  })

  it('returns a compound sort object with the primary sort set to paginaedField and its sort direction flipped when a paginatedField is provided and paginatedField is not the fallback field and sort direction is not the default', () => {
    const options = {
      paginatedField: 'someField',
      sortDirection: 1
    }

    const expectedSort = [
      { ['someField']: 'asc' },
      { [FALLBACK_PAGINATED_FIELD]: DEFAULT_SORT_DIRECTION }
    ]

    const results = createBody(query, options)

    expect(results.sort).to.deep.equal(expectedSort)
  })

  it('returns a sort object with only the primary sort, set to the paginatedField when provided a paginatedField equal to the fallback field', () => {
    const options = {
      paginatedField: '_id'
    }

    const expectedSort = [
      { ['_id']: DEFAULT_SORT_DIRECTION }
    ]

    const results = createBody(query, options)

    expect(results.sort).to.deep.equal(expectedSort)
  })

  it('returns a sort object with only the primary sort, set to the paginatedField and sort direction flipped when provided a paginatedField equal to the fallback field and sortDirection is not the default', () => {
    const options = {
      paginatedField: '_id',
      sortDirection: 'asc'
    }

    const expectedSort = [
      { ['_id']: 'asc' }
    ]

    const results = createBody(query, options)

    expect(results.sort).to.deep.equal(expectedSort)
  })

  it('returns the provided limit + 1 as the size if a paginate value is provided and not false', () => {
    const options = {
      limit: 5,
      paginate: true
    }

    expectedSize = 6

    const results = createBody(query, options)

    expect(results.size).to.equal(expectedSize)
  })

  it('returns the provided limit + 1 as the size even if a paginate value is not provided', () => {
    const options = {
      limit: 5
    }

    expectedSize = 6

    const results = createBody(query, options)

    expect(results.size).to.equal(expectedSize)
  })

  it('returns the default limit + 1 as the size if a limit is not provided', () => {
    const optionsA = {
      paginate: true
    }

    const optionsB = {}

    expectedSize = DEFAULT_LIMIT + 1

    const resultsA = createBody(query, optionsA)
    const resultsB = createBody(query, optionsB)

    expect(resultsA.size).to.equal(expectedSize)
    expect(resultsB.size).to.equal(expectedSize)
  })
})