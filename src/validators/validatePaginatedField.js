module.exports = (path, schemaKey, schemas) => {
  const paginatedFieldPattern = /^[a-z]+(?:\.[a-z]+)*$/
  const terminalTypes = ['string', 'integer', 'float', 'date', 'boolean']

  if (paginatedFieldPattern.test(path) === false) {
    throw new Error('invalid syntax')
  }

  const normalizedPath = path.split('.')

  let currentSchema = schemas[schemaKey]

  for (let i=0; i<normalizedPath.length; i++) {
    let field = currentSchema.fields[normalizedPath[i]]
    
    if (!field) {
      throw new Error('undefined field')
    }

    if (field.type === 'array') {
      throw new Error('invalid path: path cannot include array field')
    }

    if (field.type === 'reference') {
      if (i === normalizedPath.length - 1) {
        throw new Error('invalid path: path cannot have a reference as the terminal field')   
      }

      if (schemas[field.ref].class === 'collection') {
        throw new Error('invalid path: path cannot have a reference to a collection level document')
      }

      currentSchema = schemas[field.ref]
    }

    if (terminalTypes.includes(field.type)) {
      if (i !== normalizedPath.length - 1) {
        throw new Error('invalid path: terminal types can only be at the end of the path')
      }
    }
  }
}