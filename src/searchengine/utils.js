exports.findIndex = (arr, lambda) => {
  for (var i = 0; i < arr.length; i++) {
    if (lambda(arr[i]) === true) {
      return i
    }
  }

  return null
}