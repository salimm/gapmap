var map;
var service;
var infowindow;
var currentLocation;
var elevator;
var elevListenerHanlde;
var markers=[];
var directionsDisplay;
var directionsService = new google.maps.DirectionsService();
var elevInfowindow = new google.maps.InfoWindow();

MAX_DISTANCE = 10000;

cities = ['Pittsburgh, PA', 'Homestead, PA','McKeesport,PA','Boston, PA','West Newton, PA','Connellsville, PA','Ohiopyle, PA','Confluence, PA','Rockwood, PA','Meyersdale, PA','Frostburg, MD','Cumberland, MD','Paw Paw, WV','Little Orleans, MD','Hancock, MD','Williamsport, MD', 'Shepherdstown, WV','Herpers Ferry, WV','Great Falls, VA', 'Washington, DC'];
legend = {"Bike repair": './img/repair.png', 'Restaurant': './img/rest.png', 'Grocery': './img/groc.png', 'Camp area': './img/camp.png'};

var geocoder;
var weatherLayer;
var cloudLayer;

var markersMap ;

// Load the Visualization API and the columnchart package.
google.load('visualization', '1', {packages: ['columnchart']});


function initialize() {
    geocoder = new google.maps.Geocoder();
    initializeMarkersMap();
    currentLocation = new google.maps.LatLng(-34.397, 150.644);
    // Create an ElevationService
    elevator = new google.maps.ElevationService();
    success(undefined);
    createLists();     

    

}

function initializeMarkersMap(){
  markersMap = {};
  for (var i = 0; i < cities.length; i++) {
    var city = cities[i];
    markersMap[city] = [];
  }
}

function createLists(){
    var list = document.getElementById('cities-list');
    /*jshint multistr: true */
    for (var i = 0; i < cities.length; i++) {
        var city = cities[i];
        list.innerHTML += '\
        <li>\
            <label> \
                <input type="checkbox" class="citybox" onChange="showCity(this)" value="'+city+'"> '+city+' </input> \
            </label> \
        </li>\
        ';
    }

    list = document.getElementById('legend-list');
    for (var key in legend) {
        if (legend.hasOwnProperty(key)) {
            list.innerHTML += '\
            <li> \
                <img src="' + legend[key] + '"> ' + key + ' \
            </li>';
        }
    }
    
}

function success(position) {
    

    mapoptions = {
        center: currentLocation,
        zoom: 15,       
        mapTypeControl: true,
        mapTypeControlOptions: {
            mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.TERRAIN,google.maps.MapTypeId.SATELLITE],
            style: google.maps.MapTypeControlStyle.DEFAULT
        },
    };
    chart = new google.visualization.ColumnChart(document.getElementById('elevation_chart'));

    map = new google.maps.Map(document.getElementById('map'), mapoptions);
    infoWindow = new google.maps.InfoWindow();
    directionsDisplay = new google.maps.DirectionsRenderer();
    map = new google.maps.Map(document.getElementById("map"), mapoptions);
    directionsDisplay.setMap(map);
    calcRoute();

    weatherLayer = new google.maps.weather.WeatherLayer({
        temperatureUnits: google.maps.weather.TemperatureUnit.FAHRENHEIT
    });
    cloudLayer = new google.maps.weather.CloudLayer();

    

}

function error(msg) {
    alert('error: ' + msg);
}


function createMaker(place,types,address){
    var image = legend[types];
    
    var marker = new google.maps.Marker({
        position: place.geometry.location,
        map: map,
        title: place.name,
        icon: image,
        types: types
    });    


    google.maps.event.addListener(marker, 'click', function() {
        service.getDetails(place, function(result, status) {
            if (status != google.maps.places.PlacesServiceStatus.OK) {
                alert(status);
                return;
            }
            
            infoWindow.setContent(result.name);
            infoWindow.open(map, marker);
        });
    });
    
    markers.push(marker);
    if (markersMap[address]){
      markersMap[address].push(marker);
    }
}

function displayMarkers(markers){
  for (var i = 0; i < markers.length; i++) {
    marker = markers[i];
    marker.setMap(map);
  }
}

function clearAllMakers(){
    clearMakers(markers);
    emptyList(markers);
}

function clearMakers(list){
    for (var i = 0; i < list.length; i++) {
        marker = list[i];
        list[i].setMap(null);
    }
      
}
function emptyList(list){
  while (list.length) { 
      list.pop(); 
    }
}

function calcRoute() {
    var start = 'Pittsburgh, Pa';
    var end = 'Washington, DC';
    var request = {
        origin:start,
        destination:end,
        travelMode: google.maps.TravelMode.BICYCLING
    };

    

    directionsService.route(request, function(result, status) {    
        window.directionsResult = result;
        if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(result);
            initElevation(result);
        }
    });
}

function searchAt(element, type) {
    var address = element.value;

    geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            var loc  = results[0].geometry.location;
            // console.log(loc);
            
            var request = {
                location: loc,
                radius: 2000,
                query: type
            };

            service = new google.maps.places.PlacesService(map);
            service.textSearch(request,  
                function(results, status) {                  
                  origin = loc;
                  // console.log(results);
                    if (status == google.maps.places.PlacesServiceStatus.OK) {
                        tmp ="";    
                        for (var i = 0; i < results.length; i++) {
                            var place = results[i];                      
                            if (calcDistance(place.geometry.location,origin) > MAX_DISTANCE)
                                continue;
                            
                            tmp+="<li>"+place.name+" @ "+place.formatted_address+"</li>";
                            createMaker(place, type,address);            
                        }
                    }
                    else {
                        console.log(status);
                    }
                });
        } else {
            alert("Don't add new cities really fast because google has a limit on requests per second!");
        }
    });
}

function showCity(element){ 
   if(element.checked && markersMap[element.value].length ===0){
     for (var key in legend) {
          if (legend.hasOwnProperty(key)) {
              searchAt(element, key);
          }
      } 
    }else if(element.checked){
      displayMarkers(markersMap[element.value]);
    }else{
      clearMakers(markersMap[element.value]);
    }
}

function calcDistance(p1, p2){
    return (google.maps.geometry.spherical.computeDistanceBetween(p1, p2) ).toFixed(2);
}

function getElevation(event) {
    var locations = [];

    // Retrieve the clicked location and push it on the array
    var clickedLocation = event.latLng;
    locations.push(clickedLocation);

    // Create a LocationElevationRequest object using the array's one value
    var positionalRequest = {
        'locations': locations
    };

    // Initiate the location request
    elevator.getElevationForLocations(positionalRequest, function(results, status) {
        if (status == google.maps.ElevationStatus.OK) {

          // Retrieve the first result
          if (results[0]) {

            // Open an info window indicating the elevation at the clicked position
            elevInfowindow.setContent('The elevation at this point <br>is ' + results[0].elevation + ' meters.');
            elevInfowindow.setPosition(clickedLocation);
            elevInfowindow.open(map);
            } else {
                alert('No results found');
            }
        } else {
            alert('Elevation service failed due to: ' + status);
        }
    });
}

function toggleElevation(element) {
    if(element.checked) {
        map.setMapTypeId(google.maps.MapTypeId.TERRAIN);
        // Add a listener for the click event and call getElevation on that location
        elevListenerHanlde = google.maps.event.addListener(map, 'click', getElevation);
    } else {
        map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
        google.maps.event.removeListener(elevListenerHanlde);
    }
}

function toggleWeather(element) {
    if(element.checked) {
        weatherLayer.setMap(map);          
        cloudLayer.setMap(map);
    } else {
        weatherLayer.setMap(null);          
        cloudLayer.setMap(null);
    }
}


function toggleSidebar(val) {
    if (val) {
        document.getElementById("map-container").classList.add("open");
        document.getElementById("sidebar").classList.add("open");
        document.getElementById("toggle-button").classList.add("open");
    }
    else {
        document.getElementById("map-container").classList.remove("open");
        document.getElementById("sidebar").classList.remove("open");
        document.getElementById("toggle-button").classList.remove("open");
    }
    google.maps.event.trigger(map, "resize");
}


function initElevation(direc){
  var route  = direc.routes[0];
  var steps = route.legs[0].steps;
  var path = [];
  for (var i = 0; i < steps.length; i++) {
    var step = steps[i];
    path.push(step.start_point);
  }

   var pathRequest = {
    'path': path,
    'samples': 256
  };

  // Initiate the path request.
  elevator.getElevationAlongPath(pathRequest, plotElevation);
}



// Takes an array of ElevationResult objects, draws the path on the map
// and plots the elevation profile on a Visualization API ColumnChart.
function plotElevation(results, status) {
  if (status != google.maps.ElevationStatus.OK) {
    return;
  }
  var elevations = results;

  // Extract the elevation samples from the returned results
  // and store them in an array of LatLngs.
  var elevationPath = [];
  for (var i = 0; i < results.length; i++) {
    elevationPath.push(elevations[i].location);
  }

  

  // Extract the data from which to populate the chart.
  // Because the samples are equidistant, the 'Sample'
  // column here does double duty as distance along the
  // X axis.
  var data = new google.visualization.DataTable();
  data.addColumn('string', 'Sample');
  data.addColumn('number', 'Elevation');
  for (var i = 0; i < results.length; i++) {
    data.addRow(['', elevations[i].elevation]);
  }

  // Draw the chart using the data within its DIV.
  document.getElementById('elevation_chart').style.display = 'block';
  chart.draw(data, {
    height: 150,
    width:'100%',
    legend: 'none',
    titleY: 'Elevation (m)'
  });
}
