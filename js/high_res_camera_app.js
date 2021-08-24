var track = null;

// Define constants
const cameraView = document.querySelector("#camera--view"),
    cameraOutput = document.querySelector("#camera--output"),
    cameraSensor = document.querySelector("#camera--sensor"),
    cameraTrigger = document.querySelector("#camera--trigger");

var DEVICES = [];
var final = null;
var constraints;
var imageCapture;

// Access the device camera and stream to cameraView
function cameraStart(videoSource) {
	        
    //Set constraints for the video stream
	constraints = {
			audio: false ,
			video:{
				deviceId:{exact:videoSource},width:{min:720,ideal:1280,max:1280},height:{min:720,ideal:720,max:1280}
	}};
	console.log(constraints);
	console.log("deviceId:",videoSource);
	
	navigator.mediaDevices
	.getUserMedia(constraints)
	.then(function(stream) {
		track = stream.getTracks()[0];
		cameraView.srcObject = stream;
		imageCapture = new ImageCapture(track);
	})
	.catch(function(error) {
		console.error("Oops. Something is broken.", error);
	}); 
} 

//turn on the torch
function onCapabilitiesReady(capabilities) {
	if (capabilities.torch) {
	  track.applyConstraints({
		advanced: [{torch: true}]
	  })
	  .catch(e => console.log(e));
	}
}
    
//get all the available camera lens and append to the video source selectbox
function gotDevices(deviceInfos) {
	var videoSelect = document.querySelector("#videosource");
	  for (var i = 0; i !== deviceInfos.length; ++i) {
		var deviceInfo = deviceInfos[i];
		var option = document.createElement('option');
		option.value = deviceInfo.deviceId;
		
		//if only back camera lens is needed, can add checking on the "back" keyword in the deviceInfo.label
		if (deviceInfo.kind === 'videoinput' ) {
		  option.text = deviceInfo.label || 'Camera ' +
			(videoSelect.length + 1);
		  videoSelect.appendChild(option);
		}
	}
}

//stop the video stream
function stopStreamedVideo(videoElem) {
	  const stream = videoElem.srcObject;
	  const tracks = stream.getTracks();

	  tracks.forEach(function(track) {
		console.log(track);
		track.stop();
	  });

	  videoElem.srcObject = null;
}

// Two pictures (flash and without flash) will be taken when cameraTrigger is tapped
cameraTrigger.onclick = function() {
	 imageCapture.takePhoto()
	 .then(function(blob) {
			//take the picture without flash 
			//converting the blob to input type file
			let file = new File([blob],"img.jpg",{type:"image/jpeg", lastModified:new Date().getTime()});
			let container = new DataTransfer();
			container.items.add(file);
			fileInput = document.querySelector("#docImage");
			fileInput.files = container.files;

		  }).then(function(){
			  var stream = cameraView.srcObject;
			  track = stream.getTracks()[0];

			  //light the torch
			  window.setTimeout(() => {
					  onCapabilitiesReady(track.getCapabilities());
			  }, 500);
			  
			   //take the picture with flash
			  setTimeout(() => { 
					 imageCapture.takePhoto()
					 .then(function(blob) {
							//converting the blob to input type file
							stopStreamedVideo(cameraView); 
							console.log('Took photo:', blob);
							let file = new File([blob],"img.jpg",{type:"image/jpeg", lastModified:new Date().getTime()});
							let container = new DataTransfer();
							container.items.add(file);
							fileInput = document.querySelector("#flashDocImage");
							console.log(fileInput);
							fileInput.files = container.files;	
							document.getElementById("ocrPage").submit();
						  })
			  }, 3000);
			  
		  })
		  .catch(function(error) {
			console.log('takePhoto() error: ', error);
		  })
};

//Start the video stream when the window loads
window.addEventListener("load", ()=> {
	console.log(navigator.mediaDevices);
	navigator.mediaDevices.enumerateDevices()
	.then(gotDevices)
	.then(function(){
		var videoSources = document.querySelector("#videosource");	
		var lastVideoSource = videoSources.options[videoSources.options.length - 1].value;
		videoSources.value = lastVideoSource;
		console.log("videoSource: "+videoSources.value);
		cameraStart(videoSources.value);

	})
	.catch(function(error) {
		console.log('Error in initialize camera: ', error);
	  });
	
}, false);

//change video source (camera lens)
var videoSources = document.querySelector("#videosource");		
videoSources.addEventListener("change", function() {
	console.log("change videoSource");
	stopStreamedVideo(cameraView); 
	cameraStart(videoSources.value);
});