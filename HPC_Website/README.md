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


### Code Structure
In following order we have
1. Load Dependencies
2. Setup the middlewares (such as compression, parsing of parameters, listening for errors etc)
3. Load configs and important variables
4. Setup all POST handlers (This data is posted by front-end to request data from API)
5. Setup other routes used for showing the pages.
6. Start the webserver and listen on the port

The most important thing here is the Authentication which is done in the /login POST route.
The rest are just some basic things to show a page to the user with some information.

### Front-End requests data

In public/js/dynamicLoading.js

I have written the AJAX calls that the page uses to request data. These requests are sent to the nodejs service which checks if the user is logged in or not. If the user is logged in then the nodejs service will make a GET request to the nodejs REST Api which will return the data which is then returned to the client who requested the data.

The data in this case can be job count of a user, general information about a job, detailed information etc.


### Example for requesting data from front-end

dynamicLoading.js:
This will send a request to the front-end nodejs service.
```javascript
$.ajax({
  type: "POST",
  url: '/jobs/blocked',
  success: function (result) {
    //another function which handles the data
    doStuff(result);
  },
  error: function(err) {
    console.log('error'+JSON.stringify(err));
  }
});
```

front-end nodejs index.js: uses a middleware function to check if the user is authenticated or not. If the user is authenticated then it will make a request to the API.
```javascript
//The request url was set to /jobs/blocked so here is where the information goes.
app.post('/jobs/blocked', user.isAuthenticated, (req, res)=>{
  const path = `http://${options.host}:${options.port}/users/${req.session.user}/jobs/count?fromdate=${req.body.fromDate}&todate=${req.body.toDate}`;
  //Use the request.js to make the reset and retrieve the code
  request(path, { json: true }, (err, response, body) => {
    //Send back the status code and the result in json.
    res.status(200).json(response.body);
  });
});
```

and then on the page or in the dynamicLoading.js your function will be executed with that data.
```javascript
function doStuff(data) {
  console.log(data);
}
```
