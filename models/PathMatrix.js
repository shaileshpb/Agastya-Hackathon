var mongoose = require('mongoose');

var PathMatrixSchema = new mongoose.Schema({
	x: {type: Number},
	y: {type: Number},
	distance: {type: Number},
});

mongoose.model('PathMatrix', PathMatrixSchema);