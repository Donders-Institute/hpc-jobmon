const express = require('express');
const compression = require('compression');
const app = express();
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;


app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(compression())
app.use(function (err, req, res) {
  console.error(err.stack);
  res.status(200).json({success: false, error: 'There seems to be an error. Please contact an administrator about this, API Index.js line 17'});
});


var manager = require('./controllers/manager.js');


app.get('/jobs/:jobid', manager.getJobInfo);
app.get('/jobs/:jobid/extra', manager.getJobExtended);
app.get('/users/:user/jobs', manager.getJobsByUser);
app.get('/users/:user/jobs/count', manager.countJobsByUser);
app.get('/users/:user/jobs/blocked', manager.getBlockedJobsByUser);
app.get('/users/:user/jobs/blocked/count', manager.countBlockedJobsByUser);


app.on('error', function(err){
    console.error('on error handler');
    console.error(err);
});
app.on('clientError', function(err){
    console.error('on clientError handler');
    console.error(err);
});
process.on('uncaughtException', function(err) {
    console.error('process.on handler');
    console.error(err);
});


app.listen(port, () => {
  console.log("Started listening on port: " + port);
});
