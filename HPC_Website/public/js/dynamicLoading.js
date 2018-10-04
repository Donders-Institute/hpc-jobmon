//Set the filters default values
function setupFilters() {
  //Padding for numbers < 10 to make valid date format for date input..
  //source: https://stackoverflow.com/questions/14212527/how-to-set-default-value-to-the-inputtype-date
  function zeroPadded(val) {
    if (val >= 10)
    return val;
    else
    return '0' + val;
  }

  var now = new Date();
  var lastMonth = `${now.getFullYear()}-${zeroPadded((now.getMonth()-1)%12+1)}-${zeroPadded(now.getDate())}`;
  var nextMonth = `${now.getFullYear()}-${zeroPadded((now.getMonth()+1)%12+1)}-${zeroPadded(now.getDate())}`;

  $('#fromDate').val(lastMonth);
  $('#toDate').val(nextMonth);
}
//Get the counts for the tab badges that display how many jobs are found with that job status
function getTabCounts() {

  var fromDate = $('#fromDate').val() + "T00:00:00";
  var toDate = $('#toDate').val() + "T23:59:59";
  //Adding 00:00:00 and 23:59:59 made the dates inclusive with beginning and end date.
  $.ajax({
    type: "POST",
    url: '/count',
    data: {fromDate: fromDate, toDate: toDate},
    success: function (result) {
      //If in a certain period there are 0 completed jobs. then it wont return that item in the array. And thus it won't get the updated value.
      //We have to manually reset them.
      var jobstates = ["q", "r", "c", "b"];
      for (var i in jobstates) {
        $(`#${jobstates[i]}_count`).html(0);
      }

      result.data.forEach((item)=>{
        //Add pagination for every
        let element = $(`#pagination-${item['job_state']}`);
        for (let i = 1; i <= (Math.ceil((item['count'] / $('#pageLimit').val()))); i++) {
          //One extra function at the onclick because of the pagination highlighting
          element.append(`<li class="page-item"><a class="page-link" href="#" onClick="highlightPagination(this, '${item['job_state']}');getJobs(${i}, '${item['job_state']}')">${i}</a></li>`);
        }

        $(`#${item['job_state']}_count`).html(item['count']);
      });
    },
    error: function() {
      console.log('error');
    }
  });

  $.ajax({
    type: "POST",
    url: '/jobs/blocked/count',
    success: function (result) {
      $(`#b_count`).html(result.data.count);
    },
    error: function() {
      console.log('error');
    }
  });
}

//Calculate the percentage of the used time (for walltime / cpu time)
function getPercentageFromTime(used, requested) {

  //convert to seconds then calculate percentage
  var u = used.split(':');
  var r = requested.split(':');

  var u_seconds = (u[0] * 3600) + (u[1] * 60) + u[2];
  var r_seconds = (r[0] * 3600) + (r[1] * 60) + r[2];
  var percentage = (u_seconds / r_seconds) * 100;

  if (isNaN(percentage)) {
    return 0;
  }else{
    return Math.ceil(percentage);
  }
}

//Converts memory (all units to MegaBytes)
function memToMB (mem) {
  var regex = /([0-9]*)([a-zA-Z]{1,2})/g;
  var found = regex.exec(mem);

  if (mem == null || found == null) {
    return 0;
  }

  switch (found[2]) {
    case 'b':
      return Math.round((found[1] / 1024) / 1024)
      break;
    case 'kb':
      return Math.round(found[1] / 1024)
      break;
    case 'mb':
      return Math.round(found[1])
      break;
    case 'gb':
      return Math.round(found[1] * 1024)
      break;
    case 'tb':
      return Math.round((found[1] * 1024) * 1024)
      break;
    default:
      console.log("[Error] Could not detect memory unit")
      return 0
  }
}

function getInfo(job_ID) {

  $.ajax({
    type: "POST",
    url: '/jobinfo',
    data: {jobid: job_ID},
    success: function (result) {
      //something else
      if (result.success) {

        var data = result.data[0];

        $('.modal-title').html('Job ID: '+ data['ID'])
        $('.modal #job_properties').html('');

        //Used walltime caluclation
        $('#walltime').html(data['used_walltime'] + " / " + data['r_walltime']);
        var w_percentage = getPercentageFromTime(data['used_walltime'], data['r_walltime']);
        $('#used_walltime_progress').html(`<div class="progress-bar" role="progressbar" style="width: ${w_percentage}%;" aria-valuenow="${w_percentage}" aria-valuemin="0" aria-valuemax="100">${w_percentage}%</div>`);

        //Memory percentage calculation
        var r_mem = memToMB(data['r_mem']);
        var u_mem = memToMB(data['used_mem']);
        var m_percentage = Math.ceil((u_mem / r_mem) * 100);
        $('#memory').html(`${u_mem} / ${r_mem} MB`);
        $('#used_memory_progress').html(`<div class="progress-bar" role="progressbar" style="width: ${m_percentage}%;" aria-valuenow="${m_percentage}" aria-valuemin="0" aria-valuemax="100">${m_percentage}%</div>`);

        $('.modal-footer').html(`
          <button type="button" class="btn btn-primary" onClick="getExtraInfo(${data['ID']})">More Info</button>
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
        `)

        Object.keys(data).forEach(function(key,index) {
          $('.modal #job_properties').append(`<h5>${key}: <b>${data[key]}</b></h5>`);
        });
        //show modal with info
        $('.modal').modal('toggle');
      }
    },
    error: function() {
      console.log('error');
    }
  });
}

function getExtraInfo(job_ID) {

  $.ajax({
    type: "POST",
    url: '/jobinfo/extra',
    data: {jobid: job_ID},
    success: function (result) {
      //something else
      if (result.success) {

        var data = result.data[0];

        $('.modal-footer').html(`
          <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
        `)

        Object.keys(data).forEach(function(key,index) {
          $('.modal #job_properties').append(`<h5>${key}: <b>${data[key]}</b></h5>`);
        });
      }
    },
    error: function() {
      console.log('error');
    }
  });
}

function getBlockedJobs() {
  $.ajax({
    type: "POST",
    url: '/jobs/blocked',
    success: function (result) {
      loadBlockedJobs(result);
    },
    error: function(err) {
      console.log('error'+JSON.stringify(err));
    }
  });
}

//getJobs gets called from tabCounts and for pagination to refresh the data with new one
function getJobs(offset, job_state) {

  var limit = $('#pageLimit').val();
  var fromDate = $('#fromDate').val() + "T00:00:00";
  var toDate = $('#toDate').val() + "T23:59:59";
  //Because we start at 0 but pagination starts at 1 therefore we need the -1
  var offset = (offset - 1) * limit;
  var job_state = job_state;

  $.ajax({
    type: "POST",
    url: '/jobs',
    data: {offset: offset, limit: limit, fromDate: fromDate, toDate: toDate, job_state: job_state},
    success: function (result) {
      loadJobs(result, job_state);
    },
    error: function() {
      console.log('error');
    }
  });
}

function loadJobs(result, job_state) {

  var fullJobState = 'completed';
  switch (job_state) {
    case 'c':
      $('#completed .content').html('');
      fullJobState = 'completed'
      break;
    case 'r':
      $('#running .content').html('');
      fullJobState = 'running';
      break;
    case 'q':
      $('#queued .content').html('');
      fullJobState = 'queued';
      break;
    default:
      console.log('Something went wrong here');
  }

  if (result.success) {
    result.data.forEach((element)=>{

      $(`#${fullJobState} .content`).append(`
        <div class="col-12 col-sm-6 col-md-4">
          <div class="card">
            <div class="card-body card-header">
              <h5 class="card-title">${element.ID}</h5>
            </div>
            <ul class="list-group list-group-flush">
              <li class="list-group-item">Status: <span class="${fullJobState}">${fullJobState}</span></li>
              <li class="list-group-item">job name: ${element.job_name}</li>
              <li class="list-group-item">queue: ${element.queue}</li>
              <li class="list-group-item">exit status: ${element.exit_status}</li>
            </ul>
            <div class="card-body">
              <a href="#" onClick="getInfo(${element.ID});" class="card-link">More Info</a>
            </div>
          </div>
        </div>
      `);

    });
  }
}

function loadBlockedJobs(result) {
  $(`#blocked .content`).html('');

  if (result.success) {
  result.data.forEach((element)=>{

      $(`#blocked .content`).append(`
        <div class="col-12 col-sm-6 col-md-4">
          <div class="card">
            <div class="card-body card-header">
              <h5 class="card-title">${element.id}</h5>
            </div>
            <ul class="list-group list-group-flush">
              <li class="list-group-item">Status: <span class="blocked">blocked</span></li>
            <li class="list-group-item"><B>Reason:</B>                                                                                                                                                                                  X,M${element.reason}</li>
            </ul>
          </div>
        </div>
      `);

    });
  }
}

function applyFilters() {
  $('#completed .content').html('<div class="loader"></div>');
  $('#running .content').html('<div class="loader"></div>');
  $('#queued .content').html('<div class="loader"></div>');
  $('#blocked .content').html('<div class="loader"></div>');

  $('#pagination-c').html('');
  $('#pagination-r').html('');
  $('#pagination-q').html('');
  $('#pagination-b').html('');

  getTabCounts();
  getJobs(1, 'c');
  getJobs(1, 'r');
  getJobs(1, 'q');
  getBlockedJobs();
}

function highlightPagination(e, jobstate) {
  $(`ul#pagination-${jobstate} li`).removeClass(`active`);
  $(e.parentElement).addClass(`active`);
}

//Completed is already loaded at the start so only load the rest
var completed = false;
var running = false;
var queued = false;
var blocked = false;
//run if page is fully loaded
$(document).ready(()=>{

  $('#tabs a').on('click', function (e) {
    e.preventDefault()
    //Only if the jobs are loaded for the first time for a specific job state
    //If it has been loaded once theres no need in loading it when the user switches tabs
    //I added an attribute so we can get the job_state really easily from the clicked tab
    var job_state = this.attributes.job_state.nodeValue;

    if (job_state == 'r' && running == false) {
      running = true;
      getJobs(1, job_state);
    }else if (job_state == 'q' && queued == false) {
      queued = true;
      getJobs(1, job_state);
    }else if (job_state == 'b' && blocked == false) {
      blocked = true;
      //get the blocked jobs here.
      getBlockedJobs();
    }else if (job_state == 'c' && completed == false) {
      completed = true;
      getJobs(1, job_state);
    }

    $(this).tab('show')
  });

  //Setup the default filter values
  setupFilters();
  // Do the first requests to load the view
  getTabCounts();
  //Get the first page of the completed jobs
  getJobs(1, 'c');
});
