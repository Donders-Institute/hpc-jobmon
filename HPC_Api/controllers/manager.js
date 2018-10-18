const mysql = require('mysql');
const fs = require('fs');
const path = require('path');

const tls = require('tls')

const dbconfig = require(path.join(__dirname + '/dbconfig.json'));


function executeQuery(req, res, query, params) {
  const con = mysql.createConnection(dbconfig);

  con.connect(function(err) {
    if (err) {
      res.status(200).json({success: false, error: err});
      console.log('[Error] at manager.js in executeQuery.connect function.');
      console.log(`[Error] ${err}`);
    }else{
      con.query(query, params, function (err, rows, fields) {
        if (err) {
          res.status(200).json({success: false, error: err});
          console.log('[Error] at manager.js in executeQuery.query function.');
          console.log(`[Error] ${err}`);
        }
        try {
          res.status(200).json({success: true, data: rows});
        } catch (e) {
          res.status(200).json({success: false, error: e});
          console.log(`[Error] sending back rows: ${e}`);
        }
        con.end();
      });
    }
  });
}
// Very difficult getting Blocked Jobs
function checkBlockedJob(jobs, callback) {
  var lastJob = 0;
  //Connect to the host over TLS and write the first message.
  var client = tls.connect({host: 'torque.dccn.nl', port: 60209}, function() {
    lastJob = jobs.pop();
    client.write(`checkBlockedJob++++${lastJob}\n`);
  });

  //Once data has been received parse that XML data and return the job.
  //Continue doing so untill all data has been parsed and all jobs have been sent out.
  var data = '';
  client.on('data', (receivedData) => {
    if (receivedData.toString().charCodeAt(receivedData.length -1) == 7) {
      data +=  receivedData.toString().substring(0, receivedData.length - 1);

      var matches = data.toString().match(RegExp('<Data>([^]*?)<\/Data>','gim'));

      var jobObject = {};
      var count = 0;
      if (matches == null) {
        //Callback to function if no jobs are found.
        callback(jobObject);
      }else{
        //If jobs are found then try to get the BlockedReason out of them
        matches.forEach((item)=> {
          var result = RegExp('BlockReason="([^"]*)"','gim').exec(item.toString());
          //If there is no BlockedReason then it is a standard batchHold and we shouldn't do anything.
          if (result == null) {
            jobObject = {id: lastJob, reason: "Unknown Reason"};
          }else{
            jobObject = {id: lastJob, reason: result[1]};
          }
        });
        //Call back to function to push the job into the array so we can show it on the page.
        callback(jobObject);
      }

      //Check if there are more jobs to request the data from.
      //If so then write the new message, If not then close the connection.
      if (jobs.length > 0) {
        lastJob = jobs.pop();
        client.write(`checkBlockedJob++++${lastJob}\n`);
      }else{
        client.write('bye\n');
        client.destroy();
      }

    }else{
      data += receivedData;
    }
  });

  //connection was closed by the server
  client.on('close', () => {
    console.log('Connection to torque.dccn.nl:60209 has been closed');
  });

  //Connection was abruptly closed by the server
  client.on('error', (err) => {
    console.log("Data from torque.dccn.nl:60209 was NOT delivered. Error: " + err)
    return false
  });
}

function getBlockedJobs(user, callback) {
  //Connect to the host. And write the message to get all blocked jobs from a user.
  var client = tls.connect({host: 'torque.dccn.nl', port: 60209}, function() {
    client.write(`getBlockedJobsOfUser++++${user}\n`);
  });

  var data = '';
  client.on('data', (receivedData) => {
    //Check if this data is the last piece of data that we'll get. ASCII 7 means end of data.
    if (receivedData.toString().charCodeAt(receivedData.length -1) == 7) {
      data +=  receivedData.toString().substring(0, receivedData.length - 1);
      //get the job ID
      var jobs = data.toString().match(RegExp('JobID="([0-9]+?)"','gim'));
      var temp = []

      if (jobs == null) {
        //If there are no jobs then callback to function
        callback(temp);
      }else{
        //If there are jobs then loop through them push them in an array and do a callback
        jobs.forEach((job)=>{
          var jobid = job.match(RegExp('[0-9]+','gim'))
          temp.push(jobid[0]);
        });
        callback(temp);
      }

      //If we're done close connection
      client.write('bye\n');
      client.destroy();
    }else{
      data += receivedData;
    }
  });

  client.on('close', () => {
    console.log("getBlockedJobs: TCP Connection to TCP service was closed");
  });

  client.on('error', (err) => {
    console.log("getBlockedJobs: Error: " + err);
    return false
  });
}

function getBlockedJobCallback(req, res, count, array) {
  //Callback check if we have gotten enough items compared to the item count.
  if (count == array.length) {
    //If so return 200 and all blocked jobs with their reason
    res.status(200).json({success: true, data: array});
  }
}


module.exports.getJobsByUser = (req, res, next) => {
  //Prepare some default query and parameter.
  let params = [req.params.user];
  let query =` SELECT * FROM user_jobs INNER JOIN tier1 ON user_jobs.ID = tier1.ID WHERE euser = ?`;

  //Check if query status exists in the get request.
  //If it exists then add it to the query. And the value to the parameters (to prevent SQL injection)
  if (typeof req.query.fromdate !== 'undefined' && typeof req.query.todate !== 'undefined') {
    query += " AND insert_datetime BETWEEN ? AND ?";
    params.push(req.query.fromdate);
    params.push(req.query.todate);
  }

  if (typeof req.query.job_state !== 'undefined') {
    query += " AND job_state = ?";
    params.push(req.query.job_state);
  }

  query += " ORDER BY insert_datetime DESC";

  if (typeof req.query.limit !== 'undefined' && req.query.limit.match(/[0-9]/g)) {
    query += ` LIMIT ${req.query.limit}`;
  }else{
    query += " LIMIT 1000";
  }

  if (typeof req.query.offset !== 'undefined' && req.query.offset.match(/[0-9]/g)) {
    query += ` OFFSET ${req.query.offset}`;
  }else{
    query += " OFFSET 0";
  }
  //Execute query and once we have the
  executeQuery(req, res, query, params, next);
}

module.exports.countJobsByUser = (req, res, next) => {

  console.log(`Counting jobs for user: ${req.params.user}`);

  let params = [req.params.user];
  let query =`SELECT count(*) as count, job_state FROM user_jobs INNER JOIN tier1 ON user_jobs.ID = tier1.ID WHERE euser = ?`;

  if (typeof req.query.fromdate !== 'undefined' && typeof req.query.todate !== 'undefined') {
    query += " AND insert_datetime BETWEEN ? AND ?";
    params.push(req.query.fromdate);
    params.push(req.query.todate);
  }

  if (typeof req.query.job_state !== 'undefined') {
    query += " AND job_state = ?";
    params.push(req.query.job_state);
  }

  query += " GROUP BY job_state"
  query += " ORDER BY insert_datetime DESC";

  executeQuery(req, res, query, params, next);

}

module.exports.getJobInfo = (req, res, next) => {
  //Prepare some default query and parameter.
  let params = [req.params.jobid, req.params.jobid, req.params.jobid];
  let query =` SELECT * FROM user_jobs, tier1, tier2 WHERE user_jobs.ID = ? AND tier1.ID = ? AND tier2.ID = ? ORDER BY insert_datetime DESC`;

  //Execute query and once we have the
  executeQuery(req, res, query, params, next);
}

module.exports.getJobExtended = (req, res, next) => {
  //Prepare some default query and parameter.
  let params = [req.params.jobid, req.params.jobid];
  let query =` SELECT * FROM user_jobs, tier3 WHERE user_jobs.ID = ? AND tier3.ID = ? ORDER BY insert_datetime DESC`;

  //Execute query and once we have the
  executeQuery(req, res, query, params, next);
}

module.exports.getBlockedJobsByUser = (req, res, next) => {
  //If user isn't specified then don't get their blocked jobs
  //Otherwise get their blocked jobs
  if (typeof req.params.user == 'undefined') {
    res.status(200).json({});
  }else{
    //If the job contains anything then get the jobs array and loop through it to get the reasons for the blocked jobs
    getBlockedJobs(req.params.user, (jobs)=> {
      if (jobs.length > 0) {
        var count = jobs.length;
        var temp = [];
        checkBlockedJob(jobs, (job) => {
          temp.push(job);
          getBlockedJobCallback(req, res, count, temp);
        });
      }else{
        res.status(200).json({});
      }
    });
  }
}

module.exports.countBlockedJobsByUser = (req, res, next) => {
  getBlockedJobs(req.params.user, (jobs)=> {
    res.status(200).json({success: true, data: {count: jobs.length}});
  });
}

// For the the statistics
module.exports.getData = (req, res, next) => {
  let params = [];
  let query = `
  SELECT
  user_jobs.insert_datetime, user_jobs.euser,
  tier1.job_state,
  tier2.r_mem, tier2.used_mem, tier2.used_cput,
  tier3.egroup
  FROM user_jobs, tier1, tier2, tier3
  WHERE tier1.ID = user_jobs.ID AND tier2.ID = user_jobs.ID AND tier3.ID = user_jobs.ID
  `;

  if (typeof req.query.fromdate !== 'undefined' && typeof req.query.todate !== 'undefined') {
    query += " AND insert_datetime >= ? AND insert_datetime <= ?";
    params.push(req.query.fromdate);
    params.push(req.query.todate);
  }else{
    var fromDate = new Date();
    fromDate.setDate(1);
    fromDate.setMonth(fromDate.getMonth()-1);

    var toDate = new Date();
    toDate.setDate(1);
    toDate.setMonth(toDate.getMonth()+1);

    query += " AND insert_datetime >= ? AND insert_datetime <= ?";
    params.push(fromDate);
    params.push(toDate);
  }

  if (typeof req.query.jobstate !== 'undefined' && req.query.jobstate != '') {
    params.push(req.query.jobstate);
    query += " AND tier1.job_state = ?"
  }

  //query+= " LIMIT 100";

  executeQuery(req, res, query, params);

}