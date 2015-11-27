angular.module('school',[])
.factory('schoolInfo', ['$http', function ($http) {

	var schoolInfoData = [];
	var pathInfoData = [];
	var pathArray = [];
	var that = this;

	var addSchool = function (lat, lng, capacity, name) {
		
	};

	var getAll = function() {
		return $http.get('/schools').success(function(data){
			console.log("schools")
			console.log(data);
	      	angular.copy(data, schoolInfoData);
	    });
	};

	this.getAllPath = function() {
		return $http.get('/pathMatrix').success(function(data){
			console.log("path");
			console.log(data);
	      	angular.copy(data, pathInfoData);
	    });
	};

	var getAllSchoolData = function () {
		return schoolInfoData;
	};

	var getAllPathData = function () {
		return pathInfoData;
	}

	return {
		addSchool: addSchool,
		getAll: getAll,
		getAllSchoolData: getAllSchoolData,
		getAllPath: this.getAllPath,
		getAllPathData: getAllPathData
	};
}]);