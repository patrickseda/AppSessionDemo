/**
 * Sample Titanium app demonstrating the usage of the AppSession module.
 */
var AppSession = require('AppSession'),
	appSession = new AppSession();
appSession.setTimeoutMs(10000); // A value of 0 means never timeout.
	
var winWidth = Ti.Platform.displayCaps.platformWidth,
	buttonHeight = 45,
	buttonWidth = 200,
	buttonLeft = winWidth/2 - buttonWidth/2,
	liveSessionColor = '#3d3',
	deadSessionColor = '#d33',
	liveSessionText = 'LIVE',
	deadSessionText = 'DEAD';

// Create visual elements.
var win = Ti.UI.createWindow({
	title : 'Session Tester',
	backgroundColor : '#68a',
	layout : 'vertical'
});
var newSessionButton = Ti.UI.createButton({
	top:40, left:buttonLeft, height:buttonHeight, width:buttonWidth,
	title : 'New Session'
});
var touchSessionButton = Ti.UI.createButton({
	top:20, left:buttonLeft, height:1.5*buttonHeight, width:buttonWidth,
	title : 'Normal App Activity'
});
var infoLabel = Ti.UI.createLabel({
	top:10, left:0, height:buttonHeight*0.7, width:winWidth, textAlign:Ti.UI.TEXT_ALIGNMENT_CENTER,
	text : '(Session timeout: ' + appSession.getTimeoutMs() + ' ms)'
});
var stateColor = Ti.UI.createView({
	top:20, left:buttonLeft, height:buttonHeight, width:buttonWidth, borderRadius:10,
	backgroundColor:deadSessionColor
});
var stateLabel = Ti.UI.createLabel({
	top:0, bottom:0, left:0, right:0, textAlign:Ti.UI.TEXT_ALIGNMENT_CENTER,
	text : deadSessionText
});
var killSessionButton = Ti.UI.createButton({
	top:110, left:buttonLeft, height:buttonHeight, width:buttonWidth,
	title : 'Force Kill Session'
});

// Add event handlers.
newSessionButton.addEventListener('click', function(e){
	appSession.startNewSession();
});
touchSessionButton.addEventListener('click', function(e){
	appSession.touch();
	// Check permission to proceed.
	if (!appSession.isLive()) {
		alert('Sorry, that\'s not allowed!\n\n(Start a new Session to continue)');
	}
});
killSessionButton.addEventListener('click', function(e){
	appSession.endSession();
});

// Create a timer to live-update the session state indicators.
setInterval(function() {
	stateColor.backgroundColor = appSession.isLive() ? liveSessionColor : deadSessionColor;
	stateLabel.text = appSession.isLive() ? liveSessionText : deadSessionText;
}, 150);

win.add(newSessionButton);
win.add(infoLabel);
win.add(stateColor);
stateColor.add(stateLabel);
win.add(touchSessionButton);
win.add(killSessionButton);
win.open();
