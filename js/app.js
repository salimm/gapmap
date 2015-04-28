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
cities = ['Homestead, PA','McKeesport,PA','Boston, PA','West Newton, PA','Connellsville, PA','Ohiopyle, PA','Confluence, PA','Rockwood, PA','Meyersdale, PA','Frostburg, MD','Cumberland, MD','Paw Paw, WV','Little Orleans','Little Orleans, MD','Hancock, MD','Williamsport, MD', 'Shepherdstown, WV','Herpers Ferry, WV','Great Falls, VA'];
var geocoder;
var weatherLayer;
var cloudLayer;


function initialize() {
 geocoder = new google.maps.Geocoder();
 currentLocation = new google.maps.LatLng(-34.397, 150.644);
 success(undefined);
 createCityList(); 
}

function createCityList(){
   var list =document.getElementById('cities-list');
   /*jshint multistr: true */
   for (var i = 0; i < cities.length; i++) {
     var city = cities[i];
     list.innerHTML += '\
      <li>\
        <input type="checkbox"  class="citybox" onChange="showCity(this)" value="'+city+'">'+city+'</input> \
      </li>\
   ';
   }

   // Create an ElevationService
  elevator = new google.maps.ElevationService();

}


function success(position) {
  // currentLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);    
  mapoptions = {
        center: currentLocation,
        zoom: 15,       
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

  initializeMenu();
}

function error(msg) {
  alert('error: ' + msg);
}




function createMaker(place,types){
  var image = "";
  if(contains(types,'bicycle_store') ){
    image = './img/repair.png';
  }else if(contains(types,'restaurant')){
    image = './img/rest.png';
  }else if(contains(types,'convenience_store') || contains(types,'grocery_or_supermarket') || contains(types,"department_store")){
    image = './img/groc.png';
  }else if(contains(types,'campground') || contains(types,'lodging') ){
    image = './img/camp.png';
  }else{
    image =undefined;
  }

  var marker = new google.maps.Marker({
        position: place.geometry.location,
        map: map,
        title: place.name,
        icon: image
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
}
function clearMakers(){
  for (var i = 0; i < markers.length; i++) {
    marker= markers[i];
    marker.setMap(null);
  }
  markers = [];
}

function calcRoute() {
  var start = 'Pittsburgh, pa';
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
    }
  });
}




 function searchAt(cityName,type) {
    var address = cityName;

    geocoder.geocode( { 'address': address}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        var loc  = results[0].geometry.location;
        console.log(loc);
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
                      createMaker(place,place.types);            
                    }
                  }else{
                    console.log(status);
                  }
                }
          );
      } else {
        alert(" Don't add new cities really fast because google has a limit on requests per second");
      }
    });
  }

  function showCity(element){
    var val = element.value;
    searchAt(val,'restaurant');
    searchAt(val,'bike repair');
    searchAt(val,'Grocery Shop');
    searchAt(val,'Camp Area');
  }

  function contains(a, obj) {
    var i = a.length;
    while (i--) {
       if (a[i] === obj) {
           return true;
       }
    }
    return false;
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










//============================================================================================
//============================================================================================
//Menu
//============================================================================================
//============================================================================================

function initializeMenu(){
  $('#elevations-toggle:checkbox').change(
    function(){
        elevs = $('#elevations-toggle');
        if(elevs.is(":checked")){
          map.setMapTypeId(google.maps.MapTypeId.TERRAIN);

          // Add a listener for the click event and call getElevation on that location
          elevListenerHanlde =google.maps.event.addListener(map, 'click', getElevation);
        }else{
          map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
          google.maps.event.removeListener(elevListenerHanlde);
        }
    });

  $('#weather-toggle:checkbox').change(
    function(){
        weather = $('#weather-toggle');
        if(weather.is(":checked")){
          
          weatherLayer.setMap(map);          
          cloudLayer.setMap(map);

        }else{
          map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
          google.maps.event.removeListener(elevListenerHanlde);

          weatherLayer.setMap(null);          
          cloudLayer.setMap(null);
        }
    });

}