var config = require('../config/config');
var mongoConnector = require('./mongodbConnector');

const catMappingTable = config.collections.catmapper;


// exports.indexCollections = function(fn){
//     mongoConnector.createCollection(config.mongodb.centralDB,catMappingTable, function (err, result) {
//       if(err){
//           fn(err);
//       }  else {
//           mongoConnector.createIndexes({_id:1},catMappingTable,config.mongodb.centralDB, function (err, result) {
//               if(err){
//                   fn(err);
//               }else {
//                   fn(null,result);
//               }
//           });
//       }
//     });
// }