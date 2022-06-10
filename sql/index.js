const queryCategoryByScore = 'select *  from `photos` where `category` = ? and `score` BETWEEN ? and ? LIMIT 100 OFFSET ?';
const queryTotalByScore = 'select COUNT(*) as `total` from `photos` where `category` = ? and `score` BETWEEN ? and ?';
const queryCategory = 'select *  from `photos` where `category` = ? LIMIT 100 OFFSET ?';
const queryTotalCategory = 'select COUNT(*) as `total` from `photos` where `category` = ?';
const queryInstagramPhotos =  'select *  from `photosInstagram` LIMIT 100 OFFSET ?';
const sqlGetUserInstagrams = 'select *  from `informationInstagram` ORDER BY RAND() LIMIT 100';
const sqlGetPhotoInstagrams = 'select *  from `photosInstagram` where `album_id` = ? LIMIT 100 OFFSET ?';
const sqlGetUserByUserName = 'select *  from `informationInstagram` where `user_name` = ?'
const sqlCountPhotoByUserName = 'select COUNT(*) as `total` from `photosInstagram` where `album_id` = ?';
module.exports = {
  queryCategoryByScore,
  queryTotalByScore,
  queryCategory,
  queryTotalCategory,
  queryInstagramPhotos,
  sqlGetUserInstagrams,
  sqlGetPhotoInstagrams,
  sqlGetUserByUserName,
  sqlCountPhotoByUserName
}