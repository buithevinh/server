const queryCategoryByScore = 'select *  from `photos` where `category` = ? and `score` BETWEEN ? and ? LIMIT 100 OFFSET ?';
const queryTotalByScore = 'select COUNT(*) as `total` from `photos` where `category` = ? and `score` BETWEEN ? and ?';
const queryCategory = 'select *  from `photos` where `category` = ? LIMIT 100 OFFSET ?';
const queryTotalCategory = 'select COUNT(*) as `total` from `photos` where `category` = ?';
const queryInstagramPhotos =  'select *  from `photosInstagram` LIMIT 100 OFFSET ?';
const sqlGetUserInstagrams = 'select *  from `informationInstagram` ORDER BY RAND() LIMIT 100';
const sqlGetPhotoInstagrams = 'select *  from `photosInstagram` where `album_id` = ? LIMIT 100 OFFSET ?';
const sqlGetUserByUserName = 'select *  from `informationInstagram` where `user_name` = ?'
const sqlCountPhotoByUserName = 'select COUNT(*) as `total` from `photosInstagram` where `album_id` = ?';
const sqlTotalInstagram = 'select COUNT(*) as `total` from `photosInstagram`';
const sqlGetUserByUserNames = 'select *  from `informationInstagram` where user_name in (?)';
const sqlGetPhotobyUserNames = 'select *  from  (select *, row_number() over (partition by album_id order by album_id desc) as seqnum from photosInstagram f) f where seqnum <= 10 and album_id in (?)';
module.exports = {
  queryCategoryByScore,
  queryTotalByScore,
  queryCategory,
  queryTotalCategory,
  queryInstagramPhotos,
  sqlGetUserInstagrams,
  sqlGetPhotoInstagrams,
  sqlGetUserByUserName,
  sqlCountPhotoByUserName,
  sqlTotalInstagram,
  sqlGetUserByUserNames,
  sqlGetPhotobyUserNames
}