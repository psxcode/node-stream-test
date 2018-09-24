const isPositiveNumber = (num: any): num is number => {
  return num && isFinite(num) && num > 0
}

export default isPositiveNumber
