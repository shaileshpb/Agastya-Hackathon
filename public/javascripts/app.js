var directionsService, directionsDisplay;
var myMap;
var activeInfoWindow;
var directionMarker = [];
var isSchoolAdded = 0;
angular.module('NGOAgastya',['ui.router','map','school','ui.router'])
.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: '/home.html',
      controller: 'MainCtrl'
    });

   $stateProvider.state('findRoutes', {
	  url: '/findRoutes',
	  templateUrl: '/findRoutes.html',
	  controller: 'MainCtrl'
	});

  $urlRouterProvider.otherwise('home');
}])
.controller("MainCtrl",['$scope','mapInitialize','marker','schoolInfo','$q','$http', function ($scope, mapInitialize, marker, schoolInfo, $q, $http) {

	var sapLabsLat = 12.979225, sapLabsLng = 77.715559;
	
	$scope.tab = 1;
	$scope.clustervisible = true;
	$scope.Navvisible = false;
	$scope.selectTab = function(setTab){
		$scope.tab = setTab;
		if(isSchoolAdded !== 0){
			$scope.clustervisible = true;
			$scope.Navvisible = false;
			isSchoolAdded = 0;
			var summaryPanel = document.getElementById('directions-panel');
			summaryPanel.innerHTML = '';
		}
	};
	$scope.isSelected = function(checkTab){
		return $scope.tab === checkTab;
	};

	$scope.schools = schoolInfo.getAllSchoolData();
	$scope.paths = [];

	$scope.createPaths = function(){
		$scope.clustervisible = false;
		$scope.Navvisible = true;
		function mapPoint(latitude,longitude,school,principal,contact,students){
                    this.latitude = latitude;
                    this.longitude = longitude;
                    this.school = school;
                    this.principal =principal;
                    this.contact = contact;
                    this.students = students;
        };

		var that = $scope;
		var map_array = [];
		var callDB = function(collection){
                var deferred = $q.defer();
                var promise = $http.get("/"+collection);
                promise.then(function(response){
                    response = response.data;
                    for(var i=0;i<response.length;i++){
                                var lat = response[i].lat;
                                var lon = response[i].lng;
                                var school = response[i].name;
                                var principal = response[i].principal;
                                var contact = response[i].contact;
                                var students = response[i].students;
                                if(lat!="" && lat!=undefined && lon!=undefined && lon!=""){
                                    var obj = new mapPoint(lat,lon,school,principal,contact,students);
                                    map_array.push(obj);
                                }
                            }
                    deferred.resolve(map_array);
                },function(){
                    console.log("Error");
                    deferred.reject("error");
                });
		    	return promise;
		    };

            callDB("schools").then(function(schoolData){
            	callDB("pathMatrix").then(function(pathData){
            		that.generatePaths(schoolData,pathData);
            	})
            })

	}

	$scope.generatePaths = function(schoolData,pathData) {

		$scope.schools = schoolData.data;
		var pathXYCoordinates = pathData.data;

		var n = $scope.schools.length;

		var pathMatrix = [];
		for(var i=0;i<n;i++) {
			pathMatrix[i] = [n];
		}
		var visibleNodes = [n];
		var visitedNodesCount = 1;
		for(var i=0; i<n;i++) {
			visibleNodes[i] = true;
		}

		for(var i=0; i<pathXYCoordinates.length; i++) {

			var x = pathXYCoordinates[i].x;
			var y = pathXYCoordinates[i].y;
			pathMatrix[x][y] = pathXYCoordinates[i].distance;	
		}

		var cluster = [];

		while(visitedNodesCount != n) {
			var position, minDistance = Number.MAX_VALUE;
			for(var i=1; i<n; i++) {
				if(visibleNodes[i] === true) {
					if(pathMatrix[0][i] < minDistance) {
						minDistance = pathMatrix[0][i];
						position = i;
					}
				}
			}
			cluster.push(shortestPath(position, minDistance));
		}

		console.log(cluster);
		
		var createConvexHull = function(singleCluster,index){


			for(var i=0; i<singleCluster.length; i++) {
				var latLng = new google.maps.LatLng($scope.schools[singleCluster[i]].lat,
	              $scope.schools[singleCluster[i]].lng);
				
				new google.maps.Marker({
	            	position: latLng,
	            	map: myMap
	          	});
			}

			var latlngbounds = new google.maps.LatLngBounds();
	      for (var i = 0; i < singleCluster.length; i++) {
	        latlngbounds.extend(new google.maps.LatLng($scope.schools[singleCluster[i]].lat,
	              $scope.schools[singleCluster[i]].lng));
	      }
	      myMap.fitBounds(latlngbounds);
	      var rectangle = new google.maps.Rectangle({
	        bounds: latlngbounds,
	        map: myMap,
	        fillColor: "#000000",
	        fillOpacity: 0.2,
	        strokeWeight: 0
	      });

	      google.maps.event.addListener(rectangle, 'dblclick', function (event) {
			 	$scope.Index = index;
			 	$scope.getPath();
		 });

        }
        for(var i=0; i<cluster.length;i++){
        	createConvexHull(cluster[i], i);
        }

		function shortestPath(startNode, minDistance) {
			var minHeap = [];
			var p = {};
			p.node = startNode;
			p.distance = 0;
			var totalDistance = minDistance;
			var totalCapacity = 0;
			var vector = [];
			minHeap.push(p);
			var bestVector = [];

			while(minHeap.length != 0) {

				var distanceTillNow = Number.MAX_VALUE;
				var nextPos;

				for(var i=0; i<minHeap.length;i++) {
					if(minHeap[i].distance < distanceTillNow) {
						distanceTillNow = minHeap[i].distance;
						nextPos = i;
					}
				}

				var node = minHeap[nextPos].node;
				vector.push(node);
				totalCapacity += $scope.schools[node].capacity;
				totalDistance += minHeap[nextPos].distance;

				visibleNodes[node] = false;
				visitedNodesCount++;

				if((totalCapacity >= 300) || (visitedNodesCount >= n)) {
					return vector;
				}

				minHeap.splice(nextPos,1);

				for(var i=1; i<n; i++) {

					if(visibleNodes[i] === true && (totalCapacity+$scope.schools[i].capacity) < 300) {
						var presentRatio = (totalDistance+pathMatrix[node][i]) / (totalCapacity+$scope.schools[i].capacity);
						var previousRation = totalDistance/totalCapacity;
						if(presentRatio <= (previousRation*2)){
							var temp = {};
							temp.node = i;
							temp.distance = pathMatrix[node][i];
							minHeap.push(temp);	
						}
						else{
							bestVector = [];
							bestVector = vector;
						}
						
					}

				}
			}
			return bestVector;
		}
		for(var i=0; i<cluster.length; i++) {
			createRoutes(cluster[i]);	
		}

		function createRoutes(singleCluster) {
			singleCluster.unshift(0);
			var minHeap = [];
			var p = {};
			p.cost = 0;
			p.node = 0;
			p.nodeCount = 0;
			p.vector = [0];

			minHeap.push(p);

			while(minHeap.length != 0) {

				var costTillNow = Number.MAX_VALUE;
				var nextPos;

				for(var i=0; i<minHeap.length; i++) {
					if(minHeap[i].cost < costTillNow) {
						costTillNow = minHeap[i].cost;
						nextPos = i;
					}
				}

				var distance = costTillNow;
				var node = minHeap[nextPos].node;
				var nodeCounter = minHeap[nextPos].nodeCount;
				var vector = minHeap[nextPos].vector;
		
				minHeap.splice(nextPos,1);

				if(node === 0 && nodeCounter === singleCluster.length) {
					$scope.paths.push(vector);
					return;
				}


				for(var i=0; i<singleCluster.length; i++) {

					var temp = {};
					temp.vector = [];
					for(var j=0; j<vector.length; j++){
						temp.vector.push(vector[j]);
					}

					if(i === 0){
						if(vector.length === singleCluster.length) {
							temp.cost = distance + pathMatrix[node][singleCluster[i]];
							temp.node = singleCluster[i];
							temp.nodeCount = nodeCounter+1;
							temp.vector.push(singleCluster[i]);
							minHeap.push(temp);
						}
					}
					else {
						if(!find(vector,singleCluster[i])) {
							temp.cost = distance + pathMatrix[node][singleCluster[i]];
							temp.node = singleCluster[i];
							temp.nodeCount = nodeCounter+1;
							temp.vector.push(singleCluster[i]);
							minHeap.push(temp);
						}
					}
				}

			}

			function find(vector, index) {
				for(var i=0; i<vector.length;i++){
					if(vector[i] === index)
						return 1;
				}
				return 0;	
			}
		}

	};

	$scope.Index = 0;

	$scope.getPrevPath = function() {
		$scope.Index--;
		if($scope.Index < 0)
			$scope.Index = 0;

		$scope.getPath();
	}

	$scope.getNextPath = function () {
		$scope.Index++;
		if($scope.Index >= $scope.paths.length)
			$scope.Index = $scope.paths.length-1;

		$scope.getPath();
	}

	$scope.getPath = function(){

		var wayPoints = [];
			
		for(var i=1;i<$scope.paths[$scope.Index].length-1; i++) {

			var j = $scope.paths[$scope.Index][i];
			wayPoints.push({
				location: new google.maps.LatLng($scope.schools[j].lat, $scope.schools[j].lng),
	    		stopover: true
			});
		}
		directionsService.route({
	    	origin: new google.maps.LatLng($scope.schools[0].lat, $scope.schools[0].lng),
	    	destination: new google.maps.LatLng($scope.schools[0].lat, $scope.schools[0].lng),
	    	waypoints: wayPoints,
	    	travelMode: google.maps.TravelMode.DRIVING
	  	}, function(response, status) {
	    	if (status === google.maps.DirectionsStatus.OK) {
	      	directionsDisplay.setDirections(response);
	      	fx(response.routes[0]);
	      	var route = response.routes[0];
		      var summaryPanel = document.getElementById('directions-panel');
		      summaryPanel.innerHTML = '';
		      var totalDistance = 0;
		      // For each route, display summary information.
		      for (var i = 0; i < route.legs.length; i++) {
		        var routeSegment = i + 1;
		        summaryPanel.innerHTML += '<b>Route Segment: ' + routeSegment +
		            '</b><br>';
		        summaryPanel.innerHTML += route.legs[i].start_address + ' to ';
		        summaryPanel.innerHTML += route.legs[i].end_address + '<br>';
		        summaryPanel.innerHTML += route.legs[i].distance.text + '<br><br>';
		        totalDistance+=route.legs[i].distance.value;
		      }

		      summaryPanel.innerHTML += ("Total Round Trip Distance = "+ (totalDistance/1000) + " Km");

	    	}
	    	else {
	      		window.alert('Directions request failed due to ' + status);
	    	}
	  	});

	
  function fx(o)
  {
  	
  	for(var i=0; i<directionMarker.length; i++){
  		directionMarker[i].setMap(null);
  	}
    if(o && o.legs)
    {
      for(l=0;l<o.legs.length;++l)
      {
        var leg=o.legs[l];
        for(var s=0;s<leg.steps.length;++s)
        {
          var step=leg.steps[s],
              a=(step.lat_lngs.length)?step.lat_lngs[0]:step.start_point,
              z=(step.lat_lngs.length)?step.lat_lngs[1]:step.end_point,
              dir=((Math.atan2(z.lng()-a.lng(),z.lat()-a.lat())*180)/Math.PI)+360,
              ico=((dir-(dir%3))%120);
              
               var singledirectionmarker = new google.maps.Marker({
                position: a,
                icon: new google.maps.MarkerImage('http://maps.google.com/mapfiles/dir_'+ico+'.png',
                                            new google.maps.Size(24,24),
                                            new google.maps.Point(0,0),
                                            new google.maps.Point(12,12)
                                           ),
          map: myMap,
          title: Math.round((dir>360)?dir-360:dir)+'°'
        });
               directionMarker.push(singledirectionmarker);

        }
      }
    }
  }

	};

}])
.controller("MapController",function($http,$q){

    this.formData = {};
    this.isShown=false;
    this.Info = "";
    this.studentsInfo = [];
    this.grade = "";
    this.strength = "";
    this.capacity = 0;
    var that = this;

    
    this.addMoreClass = function(event){
        if(that.grade!="" || that.strength!=""){
            var target = angular.element(event.target);
            target.text("Add More Class");
            target.addClass('btn-danger')
            this.studentsInfo.push({"grade":this.grade,"strength":this.strength});
            this.capacity += Number(this.strength);
            this.grade = "";
            this.strength = "";
        }
        else{
             that.isShown = true;
             that.Info = "Required!! Please fill all fields";
        }
    };

    
    this.addSchool = function() {
    	
        if(that.formData.school == "" || that.formData.principal == "" || that.formData.contact == ""
            || that.formData.latitude == "" || that.formData.longitude == "" || that.studentsInfo.length==0){
             that.isShown = true;
             that.Info = "Required!! Please fill all fields";
            }
        else{

        // Grabs all of the text box fields
        var userData = {
            name: this.formData.school,
            principal: this.formData.principal,
            contact: this.formData.contact,
            lat: this.formData.latitude,
            lng:this.formData.longitude,
            capacity: this.capacity,
            students : this.studentsInfo
        };
        isSchoolAdded = 1;


        // Saves the user data to the db
        $http.post('/schools', userData)
            .success(function (data) {

                // Once complete, clear the form (except location)
                that.formData.school = "";
                that.formData.principal = "";
                that.formData.contact = "";
                that.formData.latitude = "";
                that.formData.longitude ="";
                that.capacity = 0;
                that.isShown = true;
                that.studentsInfo = [];
                that.Info = "Successfully Added";

                setTimeout(function(){
                	that.isShown = false;
                	var target = $("#addClass");
            		target.text("Add Class");
            		target.addClass("btn-info");
                },1000);

                callDB().then(function(data){

                	var schoolInfoData = data.data;
                	var path = {
			   			x : schoolInfoData.length-1,
			   			y : schoolInfoData.length-1,
			   			distance : 0
			   		}

			   	$http.post('/pathMatrix', path).success(function (data) {
			   		console.log(path);

				});

				var service = new google.maps.DistanceMatrixService();

				var flag = 0;
				calculateDistanceCallback(0,schoolInfoData.length-1); //column
				calculateDistanceCallback(schoolInfoData.length-1,0); //row
				
				

				function calculateDistanceCallback(i, j) {
					if(i == j) {
						flag++;
						if(flag === 2) {
							that.getAllPath();
						}
						return;
					}
					else {

						var origin = new google.maps.LatLng(schoolInfoData[i].lat, schoolInfoData[i].lng);
						var destination = new google.maps.LatLng(schoolInfoData[j].lat, schoolInfoData[j].lng);

						service.getDistanceMatrix({
							    origins: [origin],
						        destinations: [destination],
						        travelMode: google.maps.TravelMode.DRIVING,
						        avoidHighways: false,
						        avoidTolls: false
						    }, 
						    callback
						);

						function callback(response, status) {

						    if(status=="OK") {
						    	var path = {
						    		x: i,
						    		y: j,
						    		distance: response.rows[0].elements[0].distance.value
						    	}
						    	$http.post('/pathMatrix', path).success(function (data) {
						    		console.log(path);
						    		
						    	});

						    	if(i>j)
						    		j++;
						    	else
						    		i++;

						    	calculateDistanceCallback(i,j);


							} else {
						        alert("Google distance api failed :( : " + status);
						    }
						}

					}
				}
                });

                
            })
            .error(function (data) {
                console.log('Post Error: ' + data);
                that.isShown = true;
                that.Info = "Failed to add";
            });
        }
    };

    	this.getAllPath = function() {
			return $http.get('/pathMatrix').success(function(data){
				console.log("path");
				console.log(data);
		    });
		};

        function mapPoint(latitude,longitude,school,principal,contact,students){
                    this.latitude = latitude;
                    this.longitude = longitude;
                    this.school = school;
                    this.principal =principal;
                    this.contact = contact;
                    this.students = students;
        };


        var map_array = [];
        var that = this;

       // createConvexHull();

		var populateMap = function(){
			var x=new google.maps.LatLng(12.979271, 77.715541);


			var options = {
		    		center:x,
		    		zoom:13,
		    		mapTypeId:google.maps.MapTypeId.SPATIAL
		  	};
           

		  	var map=new google.maps.Map(document.getElementById("googleMap"),options);
		  	directionsService = new google.maps.DirectionsService;
			directionsDisplay = new google.maps.DirectionsRenderer({
			 	suppressMarkers: false
			});
			myMap = map;

			directionsDisplay.setMap(map);
            
            var marker = new google.maps.Marker({
                            position: x,
                            icon:'images/agastya.png'
                        });

            marker.setMap(map);

            var infowindow1 = new google.maps.InfoWindow({
                    content:"Agastya International"
            });

            marker.addListener('click', function() {
                              infowindow1.open(map,marker);
            });

			
			for (var i = 1; i < map_array.length; i++) {
        			(function(mapobj) {
            			var latLng = new google.maps.LatLng(mapobj.latitude, mapobj.longitude);
            			var marker = new google.maps.Marker({
                			position: latLng,
                			map: map,
                            icon:'images/school.jpg'
            			});

            			var contentString =   '<div class="popupcontent">'+
										      '<div id="siteNotice">'+
										      '</div>'+
										      '<h1>'+mapobj.school+'</h1>'+
										      '<div id="bodyContent">'+
										      '<p><b><strong>Principal</strong>&nbsp;&nbsp;'+mapobj.principal+'</b></p>'+
										      '<p><b><strong>Contact</strong>&nbsp;&nbsp;'+mapobj.contact+'</b></p>'+
                                              '<table class="table table-hover">'+
                                              '<thead><tr><th>Grade</th><th>Strength</th></tr></thead><tbody>';

                        for(var j=0;j<mapobj.students.length;j++){
                            contentString += '<tr><td>'+mapobj.students[j].grade+'</td><td>'+mapobj.students[j].strength+'</td></tr>';
                        }

						contentString+='</tbody></table></div></div></div>';

            			var infowindow = new google.maps.InfoWindow({
    						content: contentString
  						});

  						marker.addListener('click', function() {
  							  if ( activeInfoWindow == infowindow ) {
						            return;
						        }
						        if ( activeInfoWindow ) {
						            activeInfoWindow.close();
                                    infowindow1&&infowindow1.close();
						        }
						        infowindow.open(map, marker);
						        activeInfoWindow = infowindow;
  						});

        			})(map_array[i]);
    			};	
			};


			var callDB = function(){
                var deferred = $q.defer();
                var promise = $http.get('/schools');
                promise.then(function(response){
                    response = response.data;
                    for(var i=0;i<response.length;i++){
                                var lat = response[i].lat;
                                var lon = response[i].lng;
                                var school = response[i].name;
                                var principal = response[i].principal;
                                var contact = response[i].contact;
                                var students = response[i].students;
                                if(lat!="" && lat!=undefined && lon!=undefined && lon!=""){
                                    var obj = new mapPoint(lat,lon,school,principal,contact,students);
                                    map_array.push(obj);
                                }
                            }
                            populateMap();
                    console.dir(map_array);
                    deferred.resolve(map_array);
                },function(){
                    console.log("Error");
                    deferred.reject("error");
                });
		    	return promise;
		    };
            callDB();
});

