module.exports = async ({environment, _id, client}) => {
  const { bucket, collection } = environment

  await client.delete({
    index: `${bucket.id}_${collection.id}`,
    type: `${bucket.id}_${collection.id}`,
    id: _id,
    ignore: [404]
  })
}