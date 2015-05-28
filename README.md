# beacon-locator-app
A small Android application to track the location of a person in a classroom, using bluetooth beacons.


It is built using Evothings and Cordova for developing the Android app using HTML and JS.

```
cordova plugin add cordova-plugin-file
cordova plugin add https://git-wip-us.apache.org/repos/asf/cordova-plugin-device-motion.git
```

This has two ways of working, to be set in the config.xml file:

... after building (```cordova build android```) and installing the application ipk in the phone...
* The phone is autonomous: 	```<content src="index.html" />```
* The application code is injected from the desktop IDE: ```<content src="http://myipaddress:4042" />```
** Execute ```EvothingsWorkbench```, and drag and drop the index.html file to it
** In the phone, start the app and connect to the IDE
** In the IDE, click Run on the application row

