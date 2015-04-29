$(document).ready(function(){

	$("#collapse").click(toggleElevationContainer);
});


function toggleElevationContainer(){	
	if($('#elevation-container').hasClass('visible-elev')){
		$('#elevation-container').removeClass('visible-elev');
	}else{		
		$('#elevation-container').addClass('visible-elev');
	}
}