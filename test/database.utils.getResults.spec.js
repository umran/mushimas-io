const expect = require('chai').expect
const sinon = require('sinon')
require('sinon-mongoose')
const { Document } = require('mushimas-models')
const { getResults } = require('../src/database/utils')

let DocumentMock

describe('database.utils.getResults()', () => {
  beforeEach(() => {
    DocumentMock = sinon.mock(Document)
  })

  afterEach(() => {
    DocumentMock.restore()
  })

  it('calls the find method with a limit equal to the provided limit + 1 when paginate is set to true', async () => {
    // setup the arguments
    const query = { '@document.dummyField': 'dummyValue' }
    const sort = { _id: -1 }
    const limit = 20
    const paginatedField = '_id'
    const paginate = true

    // setup the mongoResult
    const mongoResult = []

    // setup the mock
    DocumentMock
      .expects('find').withArgs(query)
      .chain('sort', sort)
      .chain('limit', limit+1)
      .chain('lean')
      .resolves(mongoResult)

    // setup the expected result
    const expectedResults = []
    let expectedCursor

    const expectedResult = {
      results: expectedResults,
      cursor: expectedCursor
    }

    // execute the method
    const result = await getResults(query, sort, limit, paginatedField, paginate)

    // verify that the expected mock is called
    DocumentMock.verify()

    // verify that the result is as expected
    expect(result).to.deep.equal(expectedResult)
  })

  it('calls the find method with no limit when paginate is set to false', async () => {
    // setup the arguments
    const query = { '@document.dummyField': 'dummyValue' }
    const sort = { _id: -1 }
    const limit = 20
    const paginatedField = '_id'
    const paginate = false

    // setup the mongoResult
    const mongoResult = []

    // setup the mock
    DocumentMock
      .expects('find').withArgs(query)
      .chain('sort', sort)
      .chain('lean')
      .resolves(mongoResult)

    // setup the expected result
    const expectedResults = []
    let expectedCursor

    const expectedResult = {
      results: expectedResults,
      cursor: expectedCursor
    }

    // execute the method
    const result = await getResults(query, sort, limit, paginatedField, paginate)

    // verify that the expected mock is called
    DocumentMock.verify()

    // verify that the result is as expected
    expect(result).to.deep.equal(expectedResult)
  })

  it('paginates results when the results returned by the database are larger than the limit', async () => {
    // setup the arguments
    const query = { '@document.dummyField': 'dummyValue' }
    const sort = { _id: -1 }
    const limit = 1
    const paginatedField = '_id'
    const paginate = true

    // setup the mongoResult
    // set mongoResult to be two records
    const mongoResult = [
      { _id: '54759eb3c090d83494e2d804', '@document': { dummyField: 'dummyValue' } },
      { _id: '54759eb3c090d83494e2d803', '@document': { dummyField: 'dummyValue' } }
    ]

    // setup the mock
    DocumentMock
      .expects('find').withArgs(query)
      .chain('sort', sort)
      .chain('limit', limit+1)
      .chain('lean')
      .resolves(mongoResult)

    // setup the expected result
    const expectedResults = [
      { _id: '54759eb3c090d83494e2d804', dummyField: 'dummyValue' }
    ]
    const expectedCursor = '54759eb3c090d83494e2d804'

    const expectedResult = {
      results: expectedResults,
      cursor: expectedCursor
    }

    // execute the method
    const result = await getResults(query, sort, limit, paginatedField, paginate)

    // verify that the expected mock is called
    DocumentMock.verify()

    // verify that the result is as expected
    expect(result).to.deep.equal(expectedResult)
  })

  it('returns a compound cursor when the results are paginated and the paginatedField is not the default field', async () => {
    // setup the arguments
    const query = { '@document.dummyField': 'dummyValue' }
    const sort = {
      '@document.otherProperties.otherOrder': -1,
      _id: -1
    }
    const limit = 1
    const paginatedField = 'otherProperties.otherOrder'
    const paginate = true

    // setup the mongoResult
    // set mongoResult to be two records
    const mongoResult = [
      { _id: '54759eb3c090d83494e2d803', '@document': { dummyField: 'dummyValue', otherProperties: { otherOrder: 4 } } },
      { _id: '54759eb3c090d83494e2d804', '@document': { dummyField: 'dummyValue', otherProperties: { otherOrder: 3 } } }
    ]

    // setup the mock
    DocumentMock
      .expects('find').withArgs(query)
      .chain('sort', sort)
      .chain('limit', limit+1)
      .chain('lean')
      .resolves(mongoResult)

    // setup the expected result
    const expectedResults = [
      { _id: '54759eb3c090d83494e2d803', dummyField: 'dummyValue', otherProperties: { otherOrder: 4 } }
    ]
    const expectedCursor = '4_54759eb3c090d83494e2d803'

    const expectedResult = {
      results: expectedResults,
      cursor: expectedCursor
    }

    // execute the method
    const result = await getResults(query, sort, limit, paginatedField, paginate)

    // verify that the expected mock is called
    DocumentMock.verify()

    // verify that the result is as expected
    expect(result).to.deep.equal(expectedResult)
  })
})