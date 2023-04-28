/**
 * Removes the given prefix from the provided value
 * This can e.g. be used to extract the attribute id from the IRI
 * @param {*} prefix 
 * @param {*} value 
 * @returns 
 */
const removePrefixFromValue = (prefix, value) =>
{
  if (value)
  {
    let toRemove = prefix.value.replace(">", "").replace("<", "");
    return value.replace(toRemove, "");
  }
  return value;
}

/**
* Removes all prefixes from the value, can be used when unsure about the actual prefix
* @param {*} prefixes 
* @param {*} value 
*/
const removeAllPrefixesFromValue = (prefixes, value) =>
{
  for (let prefix of prefixes)
  {
    value = removePrefixFromValue(prefix, value);  
  }
  return value;
}

/**
* Creates an IRI by appending a certain prefix at the start of the given value
* @param {*} prefix 
* @param {*} value 
*/
const concatToPrefix = (prefix, value) =>
{
  return `${prefix.value.replace(">", "").replace("<", "")}${value}`
}

module.exports =
{
  concatToPrefix, 
  removePrefixFromValue, 
  removeAllPrefixesFromValue
}
