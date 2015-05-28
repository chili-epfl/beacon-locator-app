$(document).ready(function() {
	$("#record").hide();
	$("#stop").hide();
    $("#record").click(function(){
        $("#record").hide();
        $("#stop").show();
        startLogging();
    }); 
    $("#stop").click(function(){
        $("#stop").hide();
        $("#record").show();
        stopLogging();
    }); 
});

var dataDir;
var logging = false;
var logOb;//object for beacons log
var logOb2;//object for accel log

function initializeLogs(){
	//$("#textexp").append("beforefile");
	//Check that the global file object is available
    console.log(cordova.file);
    //We get the directory where things will go, see http://www.raymondcamden.com/2014/11/05/Cordova-Example-Writing-to-a-file
	window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, function(dir) {
		dataDir = dir; //We store it for later use
		//console.log("got main dir",dir);
		//alert("got main dir "+dir.fullPath);
		$("#record").show();
		//$("#textexp").append("got main dir "+dir.fullPath);
	});

}

function startLogging(){
	logging = true;
	//TODO: Create the log file with timestamp as name and empty data
	var filename = "locator-app-"+Date.now()+".txt";
		dataDir.getFile(filename, {create:true}, function(file) {
		 	//console.log("got the file", file);
		 	//alert("got the file "+file);
			//$("#textexp").append("got the file "+file.fullPath);
		 	logOb = file;
		 	writeLog("[]");			
		});
	//We do the same for the accelerometer data
	var filename2 = "accelerometer-app-"+Date.now()+".txt";
		dataDir.getFile(filename2, {create:true}, function(file) {
		 	//console.log("got the file", file);
		 	//alert("got the file "+file);
			//$("#textexp").append("got the file "+file.fullPath);
		 	logOb2 = file;
		 	writeLog2("[]");			
		});
}

function stopLogging(){
	logging = false;
	writeLog(JSON.stringify(logRegisters)); 
	logRegisters = [];	

	writeLog2(JSON.stringify(logRegisters2)); 
	logRegisters2 = [];	
}

var logRegisters = [];
var logRegisters2 = [];
var LOGS_PER_WRITE = 30;//Number of log entries to wait in memory before we actually write to file beacons (1/sec)
var LOGS_PER_WRITE2 = 200;//Number of log entries to wait in memory before we actually write to file accelerometer (20/sec)


function fail(e) {
	//console.log("FileSystem Error");
	alert("FileSystem Error");
	console.dir(e);
}

function writeLog(str) {
	if(!logOb){
	 //console.log("Log file not found!");	
	 alert("Beacon Log file not found!");	
	 return;
	}
	var log = str;
	//console.log("going to log "+log);
	//alert("going to log "+log);
	logOb.createWriter(function(fileWriter) {
		
		fileWriter.seek(fileWriter.length);
		
		var blob = new Blob([log], {type:'text/plain'});
		fileWriter.write(blob);
		//$("#textexp").append("ok, in theory i logged");
		//console.log("ok, in theory i worked");
	}, fail);
}

function writeLog2(str) {
	if(!logOb2){
	 //console.log("Log file not found!");	
	 alert("Accel Log file not found!");	
	 return;
	}
	var log = str;
	//console.log("going to log "+log);
	//alert("going to log "+log);
	logOb2.createWriter(function(fileWriter) {
		
		fileWriter.seek(fileWriter.length);
		
		var blob = new Blob([log], {type:'text/plain'});
		fileWriter.write(blob);
		//$("#textexp").append("ok, in theory i logged");
		//console.log("ok, in theory i worked");
	}, fail);
}


var app = (function()
{
	// Application object.
	var app = {};

	// Dictionary of beacons.
	var beacons = {};

	// Timer that displays list of beacons.
	var updateTimer = null;

	app.initialize = function()
	{
		document.addEventListener('deviceready', onDeviceReady, false);
	};

	function initialiseAccelerometer()
	{
		function onSuccess(acceleration)
		{
			accelerometerHandler(acceleration.x, acceleration.y, acceleration.z, acceleration.timestamp)
		}
		function onError(error)
		{
			console.log('Accelerometer error: ' + error)
		}
		navigator.accelerometer.watchAcceleration(
			onSuccess,
			onError,
			{ frequency: 50 })
	}

	function onDeviceReady()
	{
		// Start tracking beacons!
		startScan();

		initializeLogs();

		initialiseAccelerometer();

		// Display refresh timer.
		updateTimer = setInterval(displayBeaconList, 1000);
	}

	function accelerometerHandler(accelerationX, accelerationY, accelerationZ, timestamp)
	{

				$('#found-accelerometer').empty();


				// Create tag to display beacon data.
				var element = $(
					'<li>'
					+	'X: ' + accelerationX + '<br />'
					+	'Y: ' + accelerationY + '<br />'
					+	'Z: ' + accelerationZ + '<br />'
					+ '</li>'
				);

				$('#found-accelerometer').append(element);

				if(logging){
					//Add timestamp and log registers to the logging variable
					var logEntry = {};
					logEntry.accelerationX = accelerationX;
					logEntry.accelerationY = accelerationY;
					logEntry.accelerationZ = accelerationZ;
					logEntry.timestamp = timestamp
					logRegisters2.push(logEntry);
				}

		//If 5 seconds have passed, we append the variable to the file
		if(logRegisters2.length>=LOGS_PER_WRITE2){
		 writeLog(JSON.stringify(logRegisters2)); 
		 logRegisters2 = [];	
		}

	}

	function startScan()
	{
		function onBeaconsRanged(beaconInfo)
		{
			//console.log('onBeaconsRanged: ' + JSON.stringify(beaconInfo))
			for (var i in beaconInfo.beacons)
			{
				// Insert beacon into table of found beacons.
				// Filter out beacons with invalid RSSI values.
				var beacon = beaconInfo.beacons[i];
				if (beacon.rssi < 0)
				{
					beacon.timeStamp = Date.now();
					var key = beacon.uuid + ':' + beacon.major + ':' + beacon.minor;
					beacons[key] = beacon;
				}
			}
		}

		function onError(errorMessage)
		{
			console.log('Ranging beacons did fail: ' + errorMessage);
			//alert('Ranging beacons did fail: ' + errorMessage);
		}

		// Request permission from user to access location info.
		// This is needed on iOS 8.
		estimote.beacons.requestAlwaysAuthorization();

		// Start ranging beacons.
		estimote.beacons.startRangingBeaconsInRegion(
			{}, // Empty region matches all beacons
			    // with the Estimote factory set UUID.
			onBeaconsRanged,
			onError);
	}

	function displayBeaconList()
	{
		// Clear beacon list.
		$('#found-beacons').empty();

		var timeNow = Date.now();

		// Update beacon list.
		$.each(beacons, function(key, beacon)
		{
			// Only show beacons that are updated during the last 60 seconds.
			if (beacon.timeStamp + 60000 > timeNow)
			{
				// Create tag to display beacon data.
				var element = $(
					'<li>'
					+	'Major: ' + beacon.major + '<br />'
					+	'Minor: ' + beacon.minor + '<br />'
					+	proximityHTML(beacon)
					+	distanceHTML(beacon)
					+	rssiHTML(beacon)
					+ '</li>'
				);

				$('#found-beacons').append(element);

				if(logging){
					//Add timestamp and log registers to the logging variable
					var logEntry = {};
					logEntry.timestamp = beacon.timeStamp;
					logEntry.beaconID = beacon.major+"-"+beacon.minor;
					logEntry.proximity = beacon.proximity;
					logEntry.distance = beacon.distance;
					logEntry.rssi = beacon.rssi;
					logRegisters.push(logEntry);
				}


			}



		});

		//If 5 seconds have passed, we append the variable to the file
		if(logRegisters.length>=LOGS_PER_WRITE){
		 writeLog(JSON.stringify(logRegisters)); 
		 logRegisters = [];	
		}

	}

	function proximityHTML(beacon)
	{
		var proximity = beacon.proximity;
		if (!proximity) { return ''; }

		var proximityNames = [
			'Unknown',
			'Immediate',
			'Near',
			'Far'];

		return 'Proximity: ' + proximityNames[proximity] + '<br />';
	}

	function distanceHTML(beacon)
	{
		var meters = beacon.distance;
		if (!meters) { return ''; }

		var distance =
			(meters > 1) ?
				meters.toFixed(3) + ' m' :
				(meters * 100).toFixed(3) + ' cm';

		if (meters < 0) { distance = '?'; }

		return 'Distance: ' + distance + '<br />'
	}

	function rssiHTML(beacon)
	{
		var beaconColors = [
			'rgb(214,212,34)', // unknown
			'rgb(215,228,177)', // mint
			'rgb(165,213,209)', // ice
			'rgb(45,39,86)', // blueberry
			'rgb(200,200,200)', // white
			'rgb(200,200,200)', // transparent
		];

		// Get color value.
		var color = beacon.color || 0;
		// Eliminate bad values (just in case).
		color = Math.max(0, color);
		color = Math.min(5, color);
		var rgb = beaconColors[color];

		// Map the RSSI value to a width in percent for the indicator.
		var rssiWidth = 1; // Used when RSSI is zero or greater.
		if (beacon.rssi < -100) { rssiWidth = 100; }
		else if (beacon.rssi < 0) { rssiWidth = 100 + beacon.rssi; }
		// Scale values since they tend to be a bit low.
		rssiWidth *= 1.5;

		var html =
			'RSSI: ' + beacon.rssi + '<br />'
			+ '<div style="background:' + rgb + ';height:20px;width:'
			+ 		rssiWidth + '%;"></div>'

		return html;
	}

	return app;
})();

app.initialize();
