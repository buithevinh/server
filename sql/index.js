const queryCategory = 'select * from `photos` where `category` = ? and `score` BETWEEN ? and ? limit(100)';

module.exports = {
  queryCategory
}