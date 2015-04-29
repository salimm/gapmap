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

cities = ['Pittsburgh, PA', 'Homestead, PA','McKeesport, PA','Boston, PA','West Newton, PA','Connellsville, PA','Ohiopyle, PA','Confluence, PA','Rockwood, PA','Meyersdale, PA','Frostburg, MD','Cumberland, MD','Paw Paw, WV','Little Orleans, MD','Hancock, MD','Williamsport, MD', 'Shepherdstown, WV','Herpers Ferry, WV','Great Falls, VA', 'Washington, DC'];
legend = {"Bike repair": './img/repair.png', 'Restaurant': './img/rest.png', 'Grocery': './img/groc.png', 'Camp area': './img/camp.png'};

var geocoder;
var weatherLayer;
var cloudLayer;

var myLocation;
var gelocationIsActive =false;
var geointerval ;
var centerSetOnce=false;
var refreshSpeed = 1000 *60 *2;
var myMarker = new google.maps.Marker({
        icon: './img/gear.png',
    });    

var markersMap ;

// Load the Visualization API and the columnchart package.
google.load('visualization', '1', {packages: ['columnchart']});
var charts=[];
var chartData = [];
var chartPaths = [];
var chartIndex =0;
var chartMarker = new google.maps.Marker({
        icon: './img/elevmarker.png',
    });    


function initialize() {
    geocoder = new google.maps.Geocoder();
    initializeMarkersMap();
    currentLocation = new google.maps.LatLng(-34.397, 150.644);
    // Create an ElevationService
    elevator = new google.maps.ElevationService();
    success(undefined);
    createLists();     

}

function initGui(){ 
  document.getElementById('collapse').onclick = toggleElevationContainer;
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
    
    toggleChart('chart_overall');

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
    var start = 'Sennot Square, Pittsburgh, Pa';
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
            initElevation(result,false,'elevation_chart');
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


function initElevation(direc,limitDistance,elementId){
  var route  = direc.routes[0];
  var steps = route.legs[0].steps;
  var path = [];
  for (var i = 0; i < steps.length; i++) {
    var step = steps[i];
    if(!limitDistance || calcDistance(step.start_point,myLocation)< MAX_DISTANCE){
      path.push(step.start_point);
    }
    if(!limitDistance || calcDistance(step.start_point,myLocation)< MAX_DISTANCE){
      path.push(step.end_point);
    }
  }

   var pathRequest = {
    'path': path,
    'samples': 512
  };

  // Initiate the path request.
  elevator.getElevationAlongPath(pathRequest, function(results,status){plotElevation(results,status,elementId);});
}




function toggleElevationContainer(){

  var element =document.getElementById('elevation-container');
  console.log(element.className);
  if(element.className =='visible-elev'){
    element.className = '';   
    chartMarker.setPosition(undefined);
      chartMarker.setMap(undefined);
  }else{    
    element.className = 'visible-elev';
    // document.getElementById('GChart_Frame_0').style.width='100%';
  }
}


// Takes an array of ElevationResult objects, draws the path on the map
// and plots the elevation profile on a Visualization API ColumnChart.
function plotElevation(results, status,elementId) {
  
  if (status != google.maps.ElevationStatus.OK) {
    return;
  }

  

  var index =0;
  if(elementId === 'local_elevation_chart'){
    index =1;
  }

  charts[index] = new google.visualization.ColumnChart(document.getElementById(elementId));
  google.visualization.events.addListener(charts[index], 'onmouseover', chartMouseOver);
  google.visualization.events.addListener(charts[index], 'onmouseout', chartMouseOut);

  window.chartPaths[index] = results;
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
  chartData[index] = new google.visualization.DataTable();
  chartData[index].addColumn('string', 'Sample');
  chartData[index].addColumn('number', 'Elevation');

  for (var i = 0; i < results.length; i++) {
    chartData[index].addRow([results[i], elevations[i].elevation]);
  }



  // Draw the chart using the data within its DIV.
  con=document.getElementById('elevation-container');  
  con.style.display = 'block';
  w= document.getElementById(elementId).offsetWidth;
  con.style.display = 'none';
  
  charts[index].draw(chartData[index], {
    height: 130,
    width:w,
    legend: 'none',
    titleY: 'Elevation (m)'
  });


}


function chartMouseOver(e){

  chartMarker.setPosition(chartPaths[chartIndex][e.row].location);
  if(chartMarker.map === undefined)
    chartMarker.setMap(map);

}

function chartMouseOut(e){

}


function toggleGeolocation(){

  gelocationIsActive = !gelocationIsActive && navigator.geolocation;
  if(gelocationIsActive){
    updateLocalInfo();
    geointerval = setInterval(function(){       
      updateLocalInfo();
      
    }, refreshSpeed);
  }else{
    toggleChart('chart_overall');
    clearInterval(geointerval);
    map.setZoom(7);
    centerSetOnce =false;
  }
}

function updateLocalInfo(){
  
  navigator.geolocation.getCurrentPosition(function(position) {
          myLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude); 
          //update my marker
          updateMyMarker(myLocation);

          if(!centerSetOnce){
            map.setCenter(myLocation);
            centerSetOnce=true;
          }

          map.setZoom(13);
          initElevation(window.directionsResult,true,'local_elevation_chart');
        }, function() {
            alert('no geo');
          } 
        );
}

function updateMyMarker(myLocation){
  myMarker.setPosition(myLocation);
  if(!myMarker.map)
    myMarker.setMap(map);
}

function toggleChart(id){
  hideAll();
  if(id==='chart_overall'){
    document.getElementById('radio1').checked=true;
    document.getElementById('elevation_chart').style.display='block';    
    chartIndex = 0;
  }else if(id==='chart_local'){
    document.getElementById('radio2').checked=true;
    document.getElementById('local_elevation_chart').style.display='block';  
    chartIndex = 1;    
  }
}

function hideAll(){
  document.getElementById('local_elevation_chart').style.display='none';
  document.getElementById('elevation_chart').style.display='none';
}

window.onresize = resizeCharts;

function resizeCharts () {

  if(charts[1]&&document.getElementById('local_elevation_chart').offsetWidth!=document.getElementById('local_elevation_chart').children[0].offsetWidth)
    initElevation(window.directionsResult,true,'local_elevation_chart');
  if(charts[0]&&document.getElementById('elevation_chart').offsetWidth!=document.getElementById('elevation_chart').children[0].offsetWidth)
    initElevation(window.directionsResult,false,'elevation_chart');
}



function toggleSpeed(){
  console.log('as213');
  if(refreshSpeed === 1000 *60 *2)
    refreshSpeed  = 1000 ;
  else
    refreshSpeed  =  1000 *60 *2 ;
    clearInterval(geointerval);
    geointerval = setInterval(function(){ 
        updateLocalInfo();
      }, refreshSpeed);
}