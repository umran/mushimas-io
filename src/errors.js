class GenericError extends Error {
  constructor(code, message) {
    super()
    this.message = `${code}: ${message}`
  }
}

class ResourceError extends GenericError {}

module.exports = {
  ResourceError
}