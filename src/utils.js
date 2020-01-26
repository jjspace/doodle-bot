// number a list of objects starting at iOffset
module.exports.numberList = (list, joiner = '\n', iOffset = 1) => {
  const listStr = list.map((val, i) => `${i + iOffset}: ${val}`).join(joiner);
  return listStr;
};
