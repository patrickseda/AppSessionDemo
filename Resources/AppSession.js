/**
 * Provides a client-side Session which is capable of timing out due to inactivity.
 *
 * Sample usage:
 *     // Load the module and create an instance.
 *     var AppSession = require('AppSession');
 *     var appSession = new AppSession();
 *     appSession.setTimeoutMs(30000); // A value of 0 means never timeout.
 *
 *     // Start a new Session, e.g. after an app login.
 *     // You can track session-specific info if you wish, just provide some object.
 *     appSession.startNewSession({username : 'pxtrick'});
 *
 *     // Touch the Session whenever an app UI events occurs.
 *     appSession.touch();
 *
 *     // Inspect Session values.
 *     appSession.getSessionInfo(); // Will be {username : 'pxtrick'}, provided to session creation.
 *     appSession.isLive();         // Will be 'true' as long as there is 'touch' activity.
 *
 *     // Terminate the Session, e.g. after an app logout.
 *     appSession.endSession();
 *     appSession.isLive();  // Will be 'false'.
 *
 * @author Patrick Seda - @pxtrick
 */
var AppSession = function() {
	// +-----------------------+
	// | Private members.      |
	// +-----------------------+
	// The TTL for a Session. A value of 0 means never timeout.
	var sessionTimeoutMs = 600000; // Default to 600000 ms (10 min)

	var lastAccessTime = null;
	var heartbeatTimer = null;
	var sessionInfo = null;

	// Determine if the Session can ever timeout.
	var usingTimeout = function() {
		return sessionTimeoutMs > 0;
	};
	
	// Remove the entry for the sessionInfo.
	var clearSessionInfo = function() {
		sessionInfo = null;
	};
	
	// Start the internal heartbeat thread (if timeout is enabled).
	var startHeartbeat = function() {
		if (usingTimeout()) {
			var mostFrequentPeriodMs = 15000;
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
	// Touch the Session to indicate it is still active.
	var touchSession = function() {
		if (isSessionLive()) {
			lastAccessTime = new Date(); // now
		} else {
			Ti.API.info('TOUCH (dead Session)');
		}
	};
	
	// Get the sessionInfo for the Session.
	var getSessionInfo = function() {
		if (isSessionLive()) {
			touchSession();
		} else {
			endSession();
		}
		return sessionInfo;
	};
	
	// Set the Session timeout.
	function setTimeoutMs(_timeoutMs) {
		if (_timeoutMs && (_timeoutMs >= 0)) {
			sessionTimeoutMs = _timeoutMs;
		}
	};
	
	// Get the Session timeout.
	var getTimeoutMs = function() {
		return sessionTimeoutMs;
	};
	
	// Start a new Session.
	var startNewSession = function(_sessionInfo) {
		endSession();
		_sessionInfo && (sessionInfo = _sessionInfo);
		lastAccessTime = new Date(); // now
		startHeartbeat();
	};
	
	// Determine if the Session has expired since the last request.
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
	
	// Remove all information related to the current Session.
	var endSession = function() {
		stopHeartbeat();
		lastAccessTime = null;
		clearSessionInfo();
		Ti.API.info('Your Session has ended!');
	};
	
	
	// +-----------------------+
	// | Public API.           |
	// +-----------------------+
	return {
		getSessionInfo : getSessionInfo,

		setTimeoutMs : setTimeoutMs,
		getTimeoutMs : getTimeoutMs,

		startNewSession : startNewSession,
		touch : touchSession,
		isLive : isSessionLive,
		endSession : endSession
	};
};

module.exports = AppSession;
