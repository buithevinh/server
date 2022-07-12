const queryCategoryByScore = 'select *  from `photos` as ph INNER JOIN (select `key` from `photos` where JSON_CONTAINS(`categories`, JSON_ARRAY(?)) = 1 and `score` BETWEEN ? and ? LIMIT 100 OFFSET ? ) as temp ON ph.key = temp.key';
const queryTotalByScore = 'select COUNT(*) as `total` from `photos` where JSON_CONTAINS(`categories`, JSON_ARRAY(?)) = 1 and `score` BETWEEN ? and ?';
const queryCategory = 'select * from `photos` as ph INNER JOIN (select `key` from `photos`  where `category` = ? LIMIT 100 OFFSET ?) as temp ON ph.key = temp.key';
const queryTotalCategory = 'select COUNT(*) as `total` from `photos` where `category` = ?';
const queryInstagramPhotos =  'select *  from `photosInstagram` as ph INNER JOIN (select id from `photosInstagram` where `album_id` in (?) ORDER BY RAND() LIMIT 100 OFFSET ?) as temp ON ph.id = temp.id';
const sqlGetUserInstagrams = 'select * from `informationInstagram` as ph INNER JOIN  (select id from `informationInstagram` ORDER BY RAND() LIMIT 100 ) as temp ON ph.id = temp.id';
const sqlGetPhotoInstagrams = 'select ph.id, ph.album_id, ph.category, ph.score, ph.sizes from `photosInstagram` as ph INNER JOIN (select id from `photosInstagram` where `album_id` = ? LIMIT 100 OFFSET ?) as temp ON ph.id = temp.id';
const sqlGetUserByUserName = 'select * from `informationInstagram` where `user_name` = ?'
const sqlCountPhotoByUserName = 'select COUNT(*) as `total` from `photosInstagram` where `album_id` = ?';
const sqlTotalInstagram = 'select COUNT(*) as `total` from `photosInstagram` where `album_id` in (?)';
const sqlGetUserByUserNames = 'select *  from `informationInstagram` where user_name in (?)';
const sqlGetPhotobyUserNames = 'select *  from  (select *, row_number() over (partition by album_id order by album_id desc) as seqnum from photosInstagram f) f where seqnum <= 10 and album_id in (?)';
const sqlVideoInstagram = 'select * from `videoInstagrams` as v INNER JOIN (select id from `videoInstagrams` where id not in(?) ORDER BY RAND() LIMIT 100) as temp On v.id = temp.id';
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
  sqlGetPhotobyUserNames,
  sqlVideoInstagram
}