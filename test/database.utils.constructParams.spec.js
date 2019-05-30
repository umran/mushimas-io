const expect = require('chai').expect
const { constructParams } = require('../src/database/utils')

// declare constants
const PARENT_PATH = '@document'
const DEFAULT_LIMIT = 20
const DEFAULT_SORT_DIRECTION = -1
const DEFAULT_PAGINATED_FIELD = '_id'
const DEFAULT_PAGINATE_VALUE = true
const STATE_FILTER = 'PUBLISHED'

const args = { '@document.dummyField': 'dummyValue' }

describe('database.utils.constructParams()', () => {

  it('returns the default parameters when no options are provided, ', () => {
    const expectedResults = {
      query: { ...args, '@state': STATE_FILTER },
      sort: { _id: -1 },
      limit: DEFAULT_LIMIT,
      paginatedField: DEFAULT_PAGINATED_FIELD,
      paginate: DEFAULT_PAGINATE_VALUE
    }

    const results = constructParams(args)

    expect(results).to.deep.equal(expectedResults)
  })

  it('returns a query with two cursor predicates when a cursor and paginated field are provided, but the paginatedField is not the default', () => { 
    const options = {
      paginatedField: 'dummyField',
      cursor: 'dummyName_5cdd2b7776ce1b8a0e379e46'
    }

    const expectedQuery = {
      $and: [args, { '@state': STATE_FILTER }, {
        $or: [{
          ['@document.dummyField']: { $lt: 'dummyName' }
        },
        {
          ['@document.dummyField']: 'dummyName',
          ['_id']: { $lt: '5cdd2b7776ce1b8a0e379e46' }
        }]
      }]
    }

    const { query } = constructParams(args, options)

    expect(query).to.deep.equal(expectedQuery)
  })

  // verify sortOperators
  it('returns a query with the correct sortOperators when a cursor and paginated field are provided, but the paginatedField is not the default and the sort direction is not the default', () => { 
    const options = {
      paginatedField: 'dummyField',
      cursor: 'dummyName_5cdd2b7776ce1b8a0e379e46',
      sortDirection: 1
    }

    const expectedQuery = {
      $and: [args, { '@state': STATE_FILTER }, {
        $or: [{
          ['@document.dummyField']: { $gt: 'dummyName' }
        },
        {
          ['@document.dummyField']: 'dummyName',
          // the secondary sort operator remains unchanged because client sort options only apply to the primary sort
          ['_id']: { $lt: '5cdd2b7776ce1b8a0e379e46' }
        }]
      }]
    }

    const { query } = constructParams(args, options)

    expect(query).to.deep.equal(expectedQuery)
  })

  it('returns a query with a single cursor predicate when a cursor is provided and either no paginatedField is provided or the default paginated field is provided', () => { 
    const optionA = {
      paginatedField: '_id',
      cursor: '5cdd2b7776ce1b8a0e379e46'
    }

    const optionB = {
      cursor: '5cdd2b7776ce1b8a0e379e46'
    }


    const expectedQuery = {
      $and: [args, { '@state': STATE_FILTER }, {
        ['_id']: { $lt: '5cdd2b7776ce1b8a0e379e46' }
      }]
    }

    const { query: queryA } = constructParams(args, optionA)
    const { query: queryB } = constructParams(args, optionB)

    expect(queryA).to.deep.equal(expectedQuery)
    expect(queryB).to.deep.equal(expectedQuery)
  })

  // verify sortOperators
  it('returns a query with a single cursor predicate with flipped sort operators when the non defauls sort direction is provided, a cursor is provided and either no paginatedField is provided or the default paginated field is provided', () => { 
    const optionA = {
      paginatedField: '_id',
      cursor: '5cdd2b7776ce1b8a0e379e46',
      sortDirection: 1
    }

    const optionB = {
      cursor: '5cdd2b7776ce1b8a0e379e46',
      sortDirection: 1
    }


    const expectedQuery = {
      $and: [args, { '@state': STATE_FILTER }, {
        ['_id']: { $gt: '5cdd2b7776ce1b8a0e379e46' }
      }]
    }

    const { query: queryA } = constructParams(args, optionA)
    const { query: queryB } = constructParams(args, optionB)

    expect(queryA).to.deep.equal(expectedQuery)
    expect(queryB).to.deep.equal(expectedQuery)
  })

  it('returns a query with a single predicate containing the provided args if no cursor is set', () => {
    const options = {}

    expectedQuery = {
      ...args,
      '@state': STATE_FILTER
    }

    const { query } = constructParams(args, options)

    expect(query).to.deep.equal(expectedQuery)
  })

  it('returns a sort object with two predicates when a non default paginatedField is provided', () => {
    const options = {
      paginatedField: 'dummyField'
    }

    expectedSort = {
      ['@document.dummyField']: -1,
      ['_id']: -1
    }

    const { sort } = constructParams(args, options)

    expect(sort).to.deep.equal(expectedSort)
  })

  // verify sortDirection
  it('returns a sort object with two predicates and flipped primary sort direction when a non default paginatedField is provided and the sort direction is flipped', () => {
    const options = {
      paginatedField: 'dummyField',
      sortDirection: 1
    }

    expectedSort = {
      ['@document.dummyField']: 1,
      ['_id']: -1
    }

    const { sort } = constructParams(args, options)

    expect(sort).to.deep.equal(expectedSort)
  })

  it('returns a sort object with one predicate when either the default paginatedField is provided or none is provided', () => {
    const optionsA = {
      paginatedField: '_id'
    }

    const optionsB = {}

    expectedSort = {
      ['_id']: -1
    }

    const { sort: sortA } = constructParams(args, optionsA)
    const { sort: sortB } = constructParams(args, optionsB)

    expect(sortA).to.deep.equal(expectedSort)
    expect(sortB).to.deep.equal(expectedSort)
  })

  // verify sortDirection
  it('returns a sort object with one predicate and flipped sort direction when either the default paginatedField is provided or none is provided and the sort direction is flipped', () => {
    const optionsA = {
      paginatedField: '_id',
      sortDirection: 1
    }

    const optionsB = {
      sortDirection: 1
    }

    expectedSort = {
      ['_id']: 1
    }

    const { sort: sortA } = constructParams(args, optionsA)
    const { sort: sortB } = constructParams(args, optionsB)

    expect(sortA).to.deep.equal(expectedSort)
    expect(sortB).to.deep.equal(expectedSort)
  })

  it('returns the same limit value as that provided in options', () => {
    const options = {
      limit: 9
    }

    const expectedLimit = 9

    const { limit } = constructParams(args, options)

    expect(limit).to.equal(expectedLimit)
  })

  it('returns the default limit value if none is provided in options', () => {
    const options = {}

    const expectedLimit = DEFAULT_LIMIT

    const { limit } = constructParams(args, options)

    expect(limit).to.equal(expectedLimit)
  })

  it('returns the same paginatedField value as that provided in options', () => {
    const options = {
      paginatedField: 'someField'
    }

    const expectedPaginatedField = 'someField'

    const { paginatedField } = constructParams(args, options)

    expect(paginatedField).to.equal(expectedPaginatedField)
  })

  it('returns the default paginatedField value if none is provided in options', () => {
    const options = {}

    const expectedPaginatedField = DEFAULT_PAGINATED_FIELD

    const { paginatedField } = constructParams(args, options)

    expect(paginatedField).to.equal(expectedPaginatedField)
  })

  it('returns the same paginate value as that provided in options', () => {
    const options = {
      paginate: false
    }

    const expectedPaginate = false

    const { paginate } = constructParams(args, options)

    expect(paginate).to.equal(expectedPaginate)
  })

  it('returns the default paginate value if none is provided in options', () => {
    const options = {}

    const expectedPaginate = DEFAULT_PAGINATE_VALUE

    const { paginate } = constructParams(args, options)

    expect(paginate).to.equal(expectedPaginate)
  })
})