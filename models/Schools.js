var mongoose = require('mongoose');

var SchoolSchema = new mongoose.Schema({
	lat: {type: Number},
	lng: {type: Number},
	capacity: {type: Number},
	name: String,
	principal: String,
	contact: String,
	students: {type: Array}
});

mongoose.model('School', SchoolSchema);