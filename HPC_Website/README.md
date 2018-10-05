# HPC_Website
The HPC_Website is made in NodeJS.
It uses [express](https://expressjs.com/en/starter/hello-world.html) and the templating engine [ejs](https://www.npmjs.com/package/ejs).
If you are not familiar with those two I highly suggest you look at their documentation.

### Dependencies

1. [bodyParser](https://www.npmjs.com/package/body-parser) Parse incoming request bodies in a middleware before your handlers, available under the req.body property.
2. [compression](https://github.com/expressjs/compression) Middleware to compress responses
3. [session](https://www.npmjs.com/package/express-session) Middleware to enable creation of sessions
4. [MemoryStore](https://www.npmjs.com/package/memorystore)  A session store implementation for Express using lru-cache. Because the default MemoryStore for express-session will lead to a memory leak due to it haven't a suitable way to make them expire.
5. [express](https://www.npmjs.com/package/express) The webserver
6. [ActiveDirectory](https://www.npmjs.com/package/activedirectory) ActiveDirectory is an ldapjs client for authN (authentication) and authZ (authorization) for Microsoft Active Directory with range retrieval support for large Active Directory installations.
