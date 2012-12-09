/**
 * Provides a client-side Session which is capable of timing out due to inactivity.
 *
 * Sample usage:
 *     // Load the module and create an instance.
 *     var AppSession = require('AppSession');
 *     var appSession = new AppSession();
 *     appSession.setTimeoutMs(30000); // A value of 0 means never timeout.
 *
 *     // Start a new Session, e.g. after a login.
 *     // You can track the logged-in user if you wish.
 *     appSession.startNewSession('user67');
 *
 *     // Touch the Session whenever an app UI events occurs.
 *     appSession.touch();
 *
 *     // Inspect Session values.
 *     appSession.getUserId();  // Will be 'user67'.
 *     appSession.isLive();     // Will be 'true' as long as there is 'touch' activity.
 *
 *     // Terminate the Session, e.g. after a logout.
 *     appSession.endSession();
 *     appSession.isLive();  // Will be 'false'.
 *
 * @author Patrick Seda
 */
var AppSession = function() {
	// +-----------------------+
	// | Private members.      |
	// +-----------------------+
	// The TTL for a Session. A value of 0 means never timeout.
	var sessionTimeoutMs = 600000; // 600000 ms = 10 min

	var lastAccessTime = null;
	var userIdKey = 'SESSION_USER_ID';
	var heartbeatTimer = null;

	// Determine if the Session can ever timeout.
	var usingTimeout = function() {
		return sessionTimeoutMs > 0;
	};
	
	// Remove the entry for the UserID.
	var clearUserId = function() {
		Ti.App.Properties.removeProperty(userIdKey);
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
	
	// Get the UserID for the Session.
	var getUserId = function() {
		if (isSessionLive()) {
			touchSession();
		} else {
			endSession();
		}
		return Ti.App.Properties.getString(userIdKey, null);
	};
	
	// Set the Session timeout.
	function setTimeoutMs(timeoutMs) {
		if (timeoutMs && (timeoutMs >= 0)) {
			sessionTimeoutMs = timeoutMs;
		}
	};
	
	// Get the Session timeout.
	var getTimeoutMs = function() {
		return sessionTimeoutMs;
	};
	
	// Start a new Session.
	var startNewSession = function(userIdOfSession) {
		endSession();
		var userId = userIdOfSession ? userIdOfSession : 0;
		Ti.App.Properties.setString(userIdKey, userId);
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
		clearUserId();
		Ti.API.info('Your Session has ended!');
	};
	
	
	// +-----------------------+
	// | Public API.           |
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

module.exports = AppSession;
