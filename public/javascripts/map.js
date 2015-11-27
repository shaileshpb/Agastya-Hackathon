angular.module('map',[])
.factory('mapInitialize', function () {

	var centerLocation;
	var map;
	var setCenterLocation = function(lat, lng) {
		centerLocation = new google.maps.LatLng(lat, lng);
	};

	var mapProperties = {};
	var setMapProperties = function (zoomLevel, mapType) {
		mapProperties.center = centerLocation;
		mapProperties.zoom = zoomLevel;
		mapProperties.mapTypeId = mapType;
	};

	var loadMap = function () {
		map = new google.maps.Map(document.getElementById("googleMap"),mapProperties);
	};

	var getMap = function (argument) {
		return map;
	};

	return {
		setCenterLocation: setCenterLocation,
		setMapProperties: setMapProperties,
		loadMap: loadMap,
		getMap: getMap
	 };
})
.factory('marker', function() {

	var markerLocation;
	var addMarkerLocation = function(map, school){
		markerLocation = new google.maps.LatLng(school.lat, school.lng);

		var schoolMarker = new google.maps.Marker({
		  	position:markerLocation,
		  	icon: 'images/school.jpg'
		 });
		schoolMarker.setMap(map);

		google.maps.event.addListener(schoolMarker,'click',function() {
		  	
		  	var infowindow = new google.maps.InfoWindow({
			 	content:school.name,
			});
			infowindow.open(map,schoolMarker);
		});
	};

	return {
		addMarkerLocation: addMarkerLocation
	};
});