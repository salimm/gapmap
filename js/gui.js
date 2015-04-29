function initGui(){	
	document.getElementById('collapse').onclick = toggleElevationContainer;
}



function toggleElevationContainer(){

	var element =document.getElementById('elevation-container');
	console.log(element.className);
	if(element.className =='visible-elev'){
		element.className = '';		
	}else{		
		element.className = 'visible-elev';
	}
}