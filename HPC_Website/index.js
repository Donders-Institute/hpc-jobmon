const bodyParser = require('body-parser');
const compression = require('compression');
const session = require('express-session');
const MemoryStore = require('session-memory-store')(session);
const express = require('express');
const app = express();
const port = 80;
const ActiveDirectory = require('activedirectory');
const path = require('path');
const fs = require('fs');
const request = require('request');


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

const adconfig = require(path.join(__dirname + '/controllers/adconfig.json'));
const tlsOptions = {
  ca: [ fs.readFileSync(path.join(__dirname + '/controllers/ldapscert.crt'))]
}
adconfig.tlsOptions = tlsOptions;

var user = require('./controllers/authentication.js');

//Get information from API to serve to client
var options = {
  host: process.env.APIHOST || 'localhost',
  port: process.env.APIPORT || 3000,
  method: 'GET',
  path: ''
}

//All Front-End Request that need to be forwarded to the API (user has to be authenticated for this)
app.post('/count', user.isAuthenticated, (req, res)=>{
  //Set the path to the API URL to get the information from
  //The get request data is all in lower case
  const path = `http://${options.host}:${options.port}/users/${req.session.user}/jobs/count?fromdate=${req.body.fromDate}&todate=${req.body.toDate}`;
  //Use the request.js to make the reset and retrieve the code
  request(path, { json: true }, (err, response, body) => {
    //Send back the status code and the result in json.
    if (body) {
      res.status(200).json(response.body);
    }else{
      res.status(200).json({success: false});
    }
  });

});
app.post('/jobs', user.isAuthenticated, (req, res)=>{
  const path = `http://${options.host}:${options.port}/users/${req.session.user}/jobs?fromdate=${req.body.fromDate}&todate=${req.body.toDate}&limit=${req.body.limit}&offset=${req.body.offset}&job_state=${req.body.job_state}`;
  request(path, { json: true }, (err, response, body) => {
    if (body) {
      res.status(200).json(response.body);
    }else{
      res.status(200).json({success: false});
    }
  });
});
app.post('/jobinfo', user.isAuthenticated, (req, res)=>{
  console.log('job info');
  const path = `http://${options.host}:${options.port}/jobs/${req.body.jobid}`;
  request(path, { json: true }, (err, response, body) => {
    if (body) {
      res.status(200).json(response.body);
    }else{
      res.status(200).json({success: false});
    }
  });
});
app.post('/jobinfo/extra', user.isAuthenticated, (req, res)=>{
  const path = `http://${options.host}:${options.port}/jobs/${req.body.jobid}/extra`;
  request(path, { json: true }, (err, response, body) => {
    if (body) {
      res.status(200).json(response.body);
    }else{
      res.status(200).json({success: false});
    }
  });
});
app.post('/jobs/blocked', user.isAuthenticated, (req, res)=>{
  const path = `http://${options.host}:${options.port}/users/${req.session.user}/jobs/blocked`;
  request(path, { json: true }, (err, response, body) => {
    if (body) {
      res.status(200).json(response.body);
    }else{
      res.status(200).json({success: false});
    }
  });
});
app.post('/jobs/blocked/count', user.isAuthenticated, (req, res)=>{
  const path = `http://${options.host}:${options.port}/users/${req.session.user}/jobs/blocked/count`;
  request(path, { json: true }, (err, response, body) => {
    if (body) {
      res.status(200).json(response.body);
    }else{
      res.status(200).json({success: false});
    }
  });
});

app.post('/getStats', user.isAdmin, (req, res) => {
  const path = `http://${options.host}:${options.port}/stats?fromdate=${req.body.fromdate}&todate=${req.body.todate}&jobstate=${req.body.jobstate}`;
  request(path, { json: true }, (err, response, body) => {

    if (body) {
      res.status(200).json(response.body);
    }else{
      res.status(200).json({success: false});
    }

  });
});

//Send login information and use ActiveDirectory to check if the user can be logged in.
app.get('/', user.isAuthenticated, (req, res)=>{
  res.render('index');
});

app.post('/login', (req, res)=>{
  if (typeof req.body.username !== 'undefined') {
    //Authenticate user with Active Directory
    var ad = new ActiveDirectory(adconfig);
    //Check wether user exists. And if it exists get the userPrincipalName and use that to authenticate
    ad.findUser(req.body.username, function(err, user) {
      if (err) {
        console.log('ERROR: ' +JSON.stringify(err));
        res.status(200).json({success: false, error: "Something went wrong. Try again later."});
        return;
      }
      if (!user) {
        res.status(200).json({success: false, error: "Username not found."});
      }else{
        ad.authenticate(user.userPrincipalName, req.body.password, function(err, auth) {
          if (auth) {
            //Authentication Success
            req.session.user = req.body.username;
            req.session.authenticated = true;

            if (req.body.username.endsWith("_admin")) {
              req.session.isAdmin = true;
              console.log("Admin login!");
            }

            res.status(200).json({success: true, data: "You will soon be redirected to the index."});
            return;
          }else{
            //Authentication Failed
            res.status(200).json({success: false, error: "Wrong username or password."});
            return;
          }
          if (err) {
            res.status(200).json({success: false, error: "Wrong username or password."});
            return;
          }
        });
      }
    });

  }else{
    res.status(200).json({success: false, error: "Something else went wrong please try again later. Let an administrator know about this issue if it happens often."});
  }
});

app.get('/login', (req, res)=>{
  // temporary for testing so that I don't have to log in every time.
  // req.session.user = 'sopara';
  // req.session.authenticated = true;
  // res.redirect('/');
  res.render('login');
});

app.get('/admin', user.isAuthenticated, (req, res) => {
  res.render('stats');
});

app.get('/logout', user.logout);

app.listen(port, ()=>{
  console.log(`Front-End Listening on port ${port}`);
  console.log(`Using API settings: ${options.host}:${options.port}`);
});
