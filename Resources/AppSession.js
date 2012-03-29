/**
  * Provides a client-side session which is capable of timing out due to inactivity.
  *
  * Sample usage:
  *     var AppSession = require('AppSession').AppSession;
  *     var appSession = new AppSession();
  *     appSession.setTimeoutMs(30000); // A value of 0 means never timeout.
  *
  *     // Start a new session, e.g. after a login.
  *     appSession.startNewSession('user67');
  *
  *     // Touch the session whenever an app UI events occurs.
  *     appSession.touch();
  *
  *     // Inspect session values.
  *     var userId = appSession.getUserId();  // Will be 'user67'.
  *     var isLoggedIn = appSession.isLive(); // Will be 'true'.
  *
  *     // Terminate the session, e.g. after a logout.
  *     appSession.endSession();
  *     isLoggedIn = appSession.isLive(); // Will be 'false'.
  *
  * @author Patrick Seda
  */
exports.AppSession = function() {
    // +-----------------------+
    // | Private members.      |
    // +-----------------------+
    // The TTL for a session. A value of 0 means never timeout.
    var sessionTimeoutMs = 600000; // 600000 ms = 10 min
    
    var lastAccessTime = null;
    var userIdKey = 'SESSION_USER_ID';
    var heartbeatTimer = null;
    
	// Determine if the session can ever timeout.
	var usingTimeout = function() {
		return sessionTimeoutMs > 0;
	};
    
	// Remove the entry for the UserID.
	var clearUserId = function() {
		Ti.App.Properties.removeProperty(userIdKey);
	};
	
	// Start the internal heartbeat thread if timeout is enabled.
	var startHeartbeat = function() {
		if (usingTimeout()) {
			var mostFrequentPeriodMs = 15000; // 15000 ms = 15 sec
			var heartbeatMs = Math.max(mostFrequentPeriodMs, sessionTimeoutMs/4);
			heartbeatTimer = setInterval(function() {
				if (!isSessionLive()) {
					// Session is dead, perform internal cleanup.
					endSession();
				}
			}, heartbeatMs);
		}
	};
	
	// Stop the internal life-check thread.
	var stopHeartbeat = function() {
		if (heartbeatTimer !== null) {
			clearInterval(heartbeatTimer);
			heartbeatTimer = null;
		}
	};
	
	
    // +-----------------------+
    // | Public members.       |
    // +-----------------------+
    // Touch the session to indicate it is still active.
    var touchSession = function() {
		if (isSessionLive()) {
    		lastAccessTime = new Date(); // now
    	} else {
    		Ti.API.info('TOUCH (dead session)');
    	}
    };

	// Get the UserID.
	var getUserId = function() {
		if (isSessionLive()) {
			touchSession();
		} else {
			endSession();
		}
		return Ti.App.Properties.getString(userIdKey, null);
	};
	
	// Set the session timeout.
	function setTimeoutMs(timeoutMs) {
		if (timeoutMs && (timeoutMs >= 0)) {
			sessionTimeoutMs = timeoutMs;
		}
	};
	
	// Get the session timeout.
	var getTimeoutMs = function() {
		return sessionTimeoutMs;
	};
	
	// Start a new session.
	var startNewSession = function(userIdOfSession) {
		if (isSessionLive()) {
			endSession();
		}
		var userId = userIdOfSession ? userIdOfSession : 0;
		Ti.App.Properties.setString(userIdKey, userId);
		lastAccessTime = new Date(); // now
		startHeartbeat();
	};
    
    // Determine if the session has expired since the last request.
    var isSessionLive = function() {
    	if (lastAccessTime === null) {
    		return false;
    	}
    	if (!usingTimeout()) {
    		return true;
    	}
		var now = new Date();
		return (now.getTime() - lastAccessTime.getTime() < sessionTimeoutMs);
    };
    
	// Remove all information related to the current session.
	var endSession = function() {
		stopHeartbeat();
		lastAccessTime = null;
		clearUserId();
		Ti.API.info('Your Session has ended!');
	};
	
   
    // +-----------------------+
    // | Public members.       |
    // +-----------------------+
    return {
    	getUserId : getUserId,
    	
    	setTimeoutMs : setTimeoutMs,
    	getTimeoutMs : getTimeoutMs,
    	
		startNewSession : startNewSession,
		touch : touchSession,
		isLive : isSessionLive,
		endSession : endSession
    };
};
