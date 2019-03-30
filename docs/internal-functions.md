# Internal Functions

Bento prefixes internal package only functions with `__`. Any such functions should **NEVER**
be used in your projects that consume the Bento API. These functions can change at any time and
are used to provide various bento features. Invoking them incorrectly or out of order can and will
cause massive issues for your applications.

So as a rule of thumb. If it starts with a double underscore. Steer clear!
