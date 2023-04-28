/**
 * Picks a random element from the given array
 * @param {*} array 
 * @returns A random element from the given array
 */
 const pickRandom = (array) =>
 {
  return array[Math.floor(Math.random() * array.length)];
 }
 
module.exports =
{
  pickRandom
}