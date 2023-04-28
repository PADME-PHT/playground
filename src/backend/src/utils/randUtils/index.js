const createRandomWithLength = (possible, length) =>
{
    let text = "";
    for (var i = 0; i < length; i++)
    {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

const createRandomBool = () =>
{
  return Math.random() < 0.5;
}

const createRandomUnsignedInt = (length) =>
{
  if (!length)
  {
    length = 5;  
  }
  var possible = "123456789";
  var possibleWithZero = possible + "0";

  //Prevent zeros at the beginning if length > 1
  let prefix = createRandomWithLength(length == 1 ? possibleWithZero : possible, 1);
  let suffix = createRandomWithLength(possibleWithZero, length - 1);
  let number = Number(prefix + suffix);
  //max it if random value is bigger
  return Math.min(2147483647, number);;
}

const createRandomInt = (length) =>
{
  let unsinged = createRandomUnsignedInt(length);
  //Make half of the numbers positive and half negative
  return Math.random() < 0.5 ? unsinged : -1 * unsinged;
}

const createRandomString = (length) =>
{
  if (!length)
  {
    length = 10;  
  }
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ";
  return createRandomWithLength(possible, length);
}

const getRandomBetween = (min, max) =>
{
  return Math.floor(min + Math.random()*(max - min + 1))
}
  
const createRandomDouble = (length) => 
{
  if (!length)
  {
    length = 5;  
  }
  //Create a random decimal point for the given length
  let decimalPoint = getRandomBetween(1, length - 1);
  let max = Math.pow(10, decimalPoint) - 1;
  let min = Math.pow(10, decimalPoint - 1);
  let precision = 1 / (Math.pow(10, length - decimalPoint));
  //Create floating point number with provided length
  let result = faker.datatype.float({ max: max, min: min, precision: precision }); 
  result = Math.random() < 0.5 ? result : -1 * result;
  return result;
}

/**
 * Creates a randomized password that can be used by the plugins to protect data sources
 * @returns 
 */
const createRandomUnsafePassword = (length) =>
{
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  let targetLength = length ? length : 6;
  for (var i = 0; i < targetLength; i++)
  {
    password += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return password;
}

module.exports =
{
  createRandomDouble, 
  getRandomBetween, 
  createRandomString, 
  createRandomInt, 
  createRandomUnsignedInt, 
  createRandomWithLength, 
  createRandomBool, 
  createRandomUnsafePassword, 
}
