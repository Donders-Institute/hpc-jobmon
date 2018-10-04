const session = require('express-session');
const MemoryStore = require('session-memory-store')(session);

const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const port = process.env.PORT || 80;

const compression = require('compression');
app.use(compression());

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

//Use session to keep track of logged in user. And to use username for the requests
app.use(session({
  name: 'session',
  secret: 'hallo',
  resave: true,
  saveUninitialized: false,
  maxAge: 2 * 60 * 60 * 1000, // Maximum age of 2 hours
  store: new MemoryStore({
    checkperiod: 10 * 60 //Check session every 10 minutes
  })
}));

var api = require('./controllers/request.js');
var user = require('./controllers/authentication.js');

app.get('/', user.isAuthenticated, (req, res)=>{
  res.render('index');
});

//Get information from API to serve to client
var options = {
  host: 'localhost',
  port: '3000',
  method: 'GET',
  path: ''
}

//Count all jobs and group them by job_state to show total on tab badge
app.post('/count', user.isAuthenticated, (req, res)=>{
  //Set the path to the API URL to get the information from
  options.path = `/users/${req.session.user}/jobs/count?fromdate=${req.body.fromDate}&todate=${req.body.toDate}`;
  //Use the request.js to make the reset and retrieve the code
  api.getJSON(options, (statuscode, result) => {
    //Send back the status code and the result in json.
    res.status(statuscode).json(result);
  });
});

app.post('/jobs', user.isAuthenticated, (req, res)=>{
  //The get request data is all in lower case
  options.path = `/users/${req.session.user}/jobs?fromdate=${req.body.fromDate}&todate=${req.body.toDate}&limit=${req.body.limit}&offset=${req.body.offset}&job_state=${req.body.job_state}`;
  api.getJSON(options, (statuscode, result) => {
    res.status(statuscode).json(result);
  });
});

app.post('/jobinfo', user.isAuthenticated, (req, res)=>{
  //The get request data is all in lower case
  options.path = `/jobs/${req.body.jobid}`;
  api.getJSON(options, (statuscode, result) => {
    res.status(statuscode).json(result);
  });
});

app.post('/jobinfo/extra', user.isAuthenticated, (req, res)=>{
  //The get request data is all in lower case
  options.path = `/jobs/${req.body.jobid}/extra`;
  api.getJSON(options, (statuscode, result) => {
    res.status(statuscode).json(result);
  });
});

app.post('/jobs/blocked', user.isAuthenticated, (req, res)=>{
  options.path = `/users/${req.session.user}/jobs/blocked`;
  api.getJSON(options, (statuscode, result) => {
    res.status(statuscode).json(result);
  });
});

app.post('/jobs/blocked/count', user.isAuthenticated, (req, res)=>{
  options.path = `/users/${req.session.user}/jobs/blocked/count`;
  api.getJSON(options, (statuscode, result) => {
    res.status(statuscode).json(result);
  });
});

//send login form.
app.post('/login', (req, res)=>{
  if (typeof req.body.username !== 'undefined') {
    req.session.user = req.body.username;
    req.session.authenticated = true;
    res.redirect('/');
  }else{
    res.render('login');
  }
});

app.get('/login', (req, res)=>{
  //temporary for testing so that I don't have to log in every time.
  req.session.user = 'sopara';
  req.session.authenticated = true;
  res.redirect('/');
  // res.render('login');
});
app.get('/logout', user.logout);

app.listen(port, ()=>{
  console.log(`Front-End Listening on port ${port}`);
});
