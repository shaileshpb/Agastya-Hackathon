var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var School = mongoose.model('School');
var PathMatrix = mongoose.model('PathMatrix');

router.get('/schools', function(req, res, next) {
	School.find(function (err, schools) {
		if(err) {
			return next(err);
		}
		res.json(schools);
	});
});

router.post('/schools', function(req, res, next){
	var school = new School(req.body);

	school.save(function (err, school) {
		if(err) {
			return next(err);
		}
		res.json(school);
	});
});

router.get('/pathMatrix', function(req, res, next) {
	PathMatrix.find(function (err, pathMatrix) {
		if(err) {
			return next(err);
		}
		res.json(pathMatrix);
	});
});

router.post('/pathMatrix', function(req, res, next) {
	var row = new PathMatrix(req.body);
	row.save(function (err, pathMatrix) {
		if(err) {
			return next(err);
		}
		res.json(pathMatrix);
	});
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
