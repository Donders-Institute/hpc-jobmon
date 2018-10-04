# HPC_Api
The HPC_Api is made in NodeJS.
It uses [express](https://expressjs.com/en/starter/hello-world.html) and the templating engine [ejs](https://www.npmjs.com/package/ejs).
If you are not familiar with those two I highly suggest you look at their documentation.

### Getting Started

After you have downloaded / cloned the project you can install the dependencies by running the command:
```
npm i
```
After you have done that you need to CD into the directory of the HPC_Api and run:
```
node index.js
```
or if you use nodemon like me:
```
nodemon -e ejs,css,js
```

### Code Structure of index.js

The index page is pretty easy to understand.
1. It will load the dependencies and important variables first
2. Then it will setup the middlewares (such as compression, parsing of parameters, listening for errors etc)
3. Load the required utilities. Just to keep the index.js very clean and seperate big code chunks.
4. Setup all of the request listeners/handlers
5. Listen for unexpected errors or unhandled errors
6. Start the webserver and listen on the port

All these things are in order to keep it clean and simple.
I would suggest not adding your functions to the index.js but rather use my guide below.


### Adding functions to the API

If you wish to ad functions to the API start of by creating a new file in the controllers folder.
Except if your function is an extension or addition to an already existing controller.
Write a basic test function like this that returns the data on success and an error on failure:

```javascript
//Load the dbconfig options and create a mysql connection.
const dbconfig = require(path.join(__dirname + '/dbconfig.json'));
const con = mysql.createConnection(dbconfig);

module.exports.test = (req, res) => {
  if (true) {
    res.status(200).json({success: true, data: `your username is ${req.params.user}`});
  }else{
    res.status(200).json({success: false, error: 'We failed to deliver your requested content'});
  }
}
```
Look at this [w3schools](https://www.w3schools.com/nodejs/nodejs_mysql.asp) link for more information about how to use a database connection.
If you want to use the current database or connect to your own database. Create a file like dbconfig.json and load that into a variable. dbconfig.json looks like this:

```json
{
  "host": "localhost",
  "user": "root",
  "password": "password",
  "database": "databasename"
}
```

After you have done that you can import your file and add a GET route to the index.js
Importing file example:

```javascript
var stats = require('./controllers/statistics.js');
```

And then make the GET route and make sure the request gets forwarded to your function.
You can specify parameters by using a semicolon and then the variable name.

```javascript
app.get('/test/:user', stats.test);
```

If you now send a GET request to the API using the URL [localhost:port/test/MyUsername](localhost:port/test/MyUsername)
You will get a response saying your username is MyUsername OR if it fails it will return the success false and an error message.

Last but not least. Try to use as much non-blocking code as you can as it improved the API performance.
