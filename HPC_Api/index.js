const express = require('express');
const compression = require('compression');
const app = express();
const bodyParser = require('body-parser');


const util    = require('util');
let debuglog  = util.debuglog;
util.debuglog = set => {
  if (set === 'https') {
    let pid = process.pid;
    return function() {
      let msg = util.format.apply(util, arguments);
      console.error('%s %d: %s', set, pid, msg);
    }
  }
  return debuglog(set);
}


app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(compression())

const port = process.env.PORT || 3000;

var mobile = require('./controllers/manager.js');

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).json({success: false, error: 'There seems to be an error. Please contact an administrator about this, API Index.js line 17'});
});

app.get('/jobs/:jobid', mobile.getJobInfo);
app.get('/jobs/:jobid/extra', mobile.getJobExtended);
app.get('/users/:user/jobs', mobile.getJobsByUser);
app.get('/users/:user/jobs/count', mobile.countJobsByUser);
app.get('/users/:user/jobs/blocked', mobile.getBlockedJobsByUser);
app.get('/users/:user/jobs/blocked/count', mobile.countBlockedJobsByUser);

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
