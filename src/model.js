const mongoose = require('mongoose')
const { Schema } = mongoose

const states = [
  'ARCHIVED',
  'PUBLISHED',
  'DELETED'
]

const Document = Schema({
  '@state': {
    type: String,
    required: true,
    enum: states
  },
  '@lastModified': {
    type: Date,
    required: true
  },
  '@lastCommitted': {
    type: Date,
    required: true
  },
  '@version': {
    type: Number,
    required: true
  },
  '@collectionId': {
    type: String,
    required: true
  },
  '@collection': {
    type: String,
    required: true
  },
  '@bucketId': {
    type: String,
    required: true
  },
  '@bucket': {
    type: String,
    required: true
  },
  '@document': {
    type: Schema.Types.Mixed,
    required: true
  }
})

module.exports = mongoose.model('Document', Document)