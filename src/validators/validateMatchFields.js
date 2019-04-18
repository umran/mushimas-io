const validateField = (path, schemaKey, schemas) => {
  const fieldPattern = /^[a-z]+(?:\.[a-z]+)*$/
  const terminalTypes = ['string', 'integer', 'float', 'date', 'boolean']

  if (fieldPattern.test(path) === false) {
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
      if (i === normalizedPath.length - 1 &&
        !terminalTypes.includes(field.item.type)
      ) {
        throw new Error('invalid path: path cannot have an array as the terminal field where array item is not a terminal type')
      }

      if (field.item.type === 'reference') {
        currentSchema = schemas[field.item.ref]
      }
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

module.exports = (fields, schemaKey, schemas) => {
  for (let i=0; i<fields.length; i++) {
    validateField(fields[i], schemaKey, schemas)
  }
}