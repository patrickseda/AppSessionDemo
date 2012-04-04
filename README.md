# AppSession

### _A CommonJS module for Titanium mobile applications._

This module provides a client-side Session which is capable of timing out due to inactivity.

This can be useful when an app must be aware of user UI activity, and when it has been dormant. This can help performance by reducing server-side calls to check on the Session state; i.e. if an inactive app has timed-out on the client, we know it has timed out on the server too.

