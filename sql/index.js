const queryCategoryByScore = 'select *  from `photos` where `category` = ? and `score` BETWEEN ? and ? LIMIT 100 OFFSET ?';
const queryTotalByScore = 'select COUNT(*) as `total` from `photos` where `category` = ? and `score` BETWEEN ? and ?';
const queryCategory = 'select *  from `photos` where `category` = ? LIMIT 100 OFFSET ?';
const queryTotalCategory = 'select COUNT(*) as `total` from `photos` where `category` = ?';
module.exports = {
  queryCategoryByScore,
  queryTotalByScore,
  queryCategory,
  queryTotalCategory
}