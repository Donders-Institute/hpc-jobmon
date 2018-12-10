let dataSetObject;
let downloadContents;
let userTable = [];
//variable for realtime 

$(document).ready(()=>{
  $('#myTable').hide();
  setFilterDefaults();
  $.ajax({
    type: "POST",  
    url: `/getStats`,
    data: {fromdate: $('#fromDate').val(), todate: $('#toDate').val(), jobstate: $('#jobState').val()}
  }).done((data)=>{
    console.log(`[loadStatsPromise] Data: ${data}`);
    if (data.success && data.data.length != 0) {
      dataSetObject = data;
      console.log(`[loadStatsPromise] Success: Data found and stored`);
      fadeLoaders();
      setUpTable();
    }else{
      fadeLoaders();
      console.log(`[loadStatsPromise] Warning: No data found. Refresh the page and try again`);
      alert('No data was found with these filters. Refresh the page and try again');
    }
  }).fail((xhr)=>{
    console.log(`[loadStatsPromise] Error: ${JSON.stringify(xhr)}`);
  });
});

//function to set all the filters to their default property
function setFilterDefaults() {
  console.log("[setFilterDefaults] Run");
  // Set defaults for the between dates filter to previous month to beginning of this month.
  var now = new Date();
  var lastMonth = `${now.getFullYear()}-${zeroPadded((now.getMonth()-1)%12+1)}-${zeroPadded(now.getDate())}`;
  var nextMonth = `${now.getFullYear()}-${zeroPadded((now.getMonth())%12+1)}-${zeroPadded(now.getDate())}`;

  $('#fromDate').val(lastMonth);
  $('#toDate').val(nextMonth);

  console.log("[setFilterDefaults] Finished");
}

//Register an external filter. using an input. return true means this item can be showed in the table.
$.fn.dataTable.ext.search.push(
  function(settings, data, dataIndex) {
    var min = parseInt( $('#minRequested').val(), 10 );
    var requestedMem = parseFloat( data[2] ) || 0; // use data for the requested memory column

    if (isNaN(min) || isNaN(requestedMem) || requestedMem > min) {
      return true;
    }else{
      return false;
    }
  }
);

function setUpTable() {
  let tempDataSet = [];
  //Make temporary user array. Add users to it. Then remove the duplicated users
  let tempUsers = [];    
  dataSetObject.data.forEach(data => {
    tempUsers.push(data.euser);
  });
  tempUsers = Array.from(new Set([ ...tempUsers ]));

//Make array item for each user. Loop through all users and add their information to their.
for (var i = 0; i < tempUsers.length; i++) {
  tempDataSet.push({euser: '', r_mem: 0, used_mem: 0, used_walltime: 0, egroup: '', score: 0});
  dataSetObject.data.forEach(data => {
    if (tempUsers[i] == data.euser) {
      tempDataSet[i].euser = data.euser;
      tempDataSet[i].r_mem += memToMB(data.r_mem);
      tempDataSet[i].used_mem += memToMB(data.used_mem);
      tempDataSet[i].used_walltime = addTimes(tempDataSet[i].used_walltime, data.used_walltime);
      tempDataSet[i].egroup = data.egroup;
    }
  });

  downloadContents = dataSetObject.data;
}

tempDataSet.map((data) =>{ 
  data.score = data.score + ' %';
  data.euser = `<a href="#" onClick="setUserModalData('${data.euser}');return false;">${data.euser}</a>`;
  data.egroup = `<a href="#" onClick="setGroupModalData('${data.egroup}');return false;">${data.egroup}</a>`;
  // data.used_walltime = getCPUseconds(data.used_walltime);
});

userTable = $('#myTable').DataTable( {
  data: tempDataSet,
  columnDefs: [
    { type: 'time-uni', targets: 4 }
  ],
  columns: [
    { data: 'egroup' },
    { data: 'euser' },
    { data: 'r_mem' },
    { data: 'used_mem' },
    { data: 'used_walltime' }
  ]
});

$('#minRequested').keyup( function() {
  userTable.draw();
});

$('#minScore').keyup( function() {
  userTable.draw();
});

}

function changeData(newdata) {
  let tempDataSet = [];
  //Make temporary user array. Add users to it. Then remove the duplicated users
  let tempUsers = [];    
    newdata.data.forEach(data => {
    tempUsers.push(data.euser);
  });
  tempUsers = Array.from(new Set([ ...tempUsers ]));

  //Make array item for each user. Loop through all users and add their information to their.
  for (var i = 0; i < tempUsers.length; i++) {
    tempDataSet.push({euser: '', r_mem: 0, used_mem: 0, used_walltime: 0, egroup: ''});
    newdata.data.forEach(data => {
      if (tempUsers[i] == data.euser) {
        tempDataSet[i].euser = data.euser;
        tempDataSet[i].r_mem += memToMB(data.r_mem);
        tempDataSet[i].used_mem += memToMB(data.used_mem);
        tempDataSet[i].used_walltime = addTimes(tempDataSet[i].used_walltime, data.used_walltime);
        tempDataSet[i].egroup = data.egroup;
      }
    });
  }

  tempDataSet.map((data) =>{ 
    data.euser = `<a href="#" onClick="setUserModalData('${data.euser}');return false;">${data.euser}</a>`;
    data.egroup = `<a href="#" onClick="setGroupModalData('${data.egroup}');return false;">${data.egroup}</a>`;
    // data.used_walltime = getCPUseconds(data.used_walltime);
  });

  $('#myTable').dataTable().fnClearTable();
  $('#myTable').dataTable().fnAddData(tempDataSet);

  downloadContents = tempDataSet.data;
}

function applyFilters() {
  $('#myTable').fadeOut(100);
  $('#tableLoader').fadeIn(250);

  $.ajax({
    type: "POST",  
    url: `/getStats`,
    data: {fromdate: $('#fromDate').val(), todate: $('#toDate').val(), jobstate: $('#jobState').val()}
  }).done((data)=>{
    if (data.success && data.data.length != 0) {
      dataSetObject = data;
      console.log(data);
      console.log(`[applyFilters] Success: Data found and stored`);
      changeData(dataSetObject);
      fadeLoaders();
    }else{
      console.log(`[applyFilters] Warning: No data found. Refresh the page and try again`);
      alert('No data was found with these filters. Refresh the page and try again');
      fadeLoaders();
    }
  }).fail((xhr)=>{
    console.log(`[applyFilters] Error: ${xhr}`);
  });
}

function getUserModalData(user) {
  let name = user;
  let jobs = 0;
  let req_mem = 0;
  let used_mem = 0;
  let used_walltime = 0;

  let newDataSet = dataSetObject.data.filter(job => {
    return job.euser == user;
  });

  jobs = newDataSet.length;
  newDataSet.forEach(job => {
    req_mem += memToMB(job.r_mem);
    used_mem += memToMB(job.used_mem);
    used_walltime = addTimes(used_walltime, job.used_walltime);
  });

  downloadContents = newDataSet;

  return {name, jobs, req_mem, used_mem, used_walltime};
}

function setUserModalData(user) {
  let u = getUserModalData(user);

  $('#userStatsLabel').html(u.name);
  $('#userStatsUser').html(u.name);
  $('#userStatsTotalJobs').html(u.jobs);
  $('#userStatsReqMem').html(u.req_mem + ' MB');
  $('#userStatsUsedMem').html(u.used_mem + ' MB');
  $('#userStatsWalltime').html(u.used_walltime);

  $('#userStatsFrom').html($('#fromDate').val());
  $('#userStatsTo').html($('#toDate').val());

  $('#groupStats').modal('hide');
  $('#userStats').modal('show');
}

function setGroupModalData(group) {
  let totalJobs = 0;
  let totalRequestedMemory = 0;
  let totalUsedMemory = 0;
  let totalUsedWalltime = 0;
  let users = [];
  let usersJSON = [];

  let newDataSet = dataSetObject.data.filter(job => {
    //push all users into users array. (this will get lots of duplicates but we'll fix em afterwards)
    return job.egroup == group;
  });

  newDataSet.forEach(job => {
    users.push(job.euser);
  });

  //remove all duplicated users
  users = Array.from(new Set([ ...users ]));

  //usersFromGroup
  $('#usersFromGroup').html('');
  users.forEach(user => {
    let u = getUserModalData(user);
    usersJSON.push(u);
    $('#usersFromGroup').append(`
      <tr>
        <td><a href="#" onClick="setUserModalData('${u.name}'); return false;">${u.name}</a></td>
        <td> ${u.jobs} </td>
        <td> ${u.req_mem} </td>
        <td> ${u.used_mem} </td>
        <td> ${u.used_walltime} </td>
      </tr>
    `);
  });

  totalJobs = newDataSet.length;
  newDataSet.forEach(job => {
    totalRequestedMemory += memToMB(job.r_mem);
    totalUsedMemory += memToMB(job.used_mem);
    totalUsedWalltime = addTimes(totalUsedWalltime, job.used_walltime);
  });

  downloadContents = {...usersJSON};

  $('#groupStatsLabel').html(group);
  $('#groupStatsGroup').html(group);
  $('#groupStatsTotalJobs').html(totalJobs);
  $('#groupStatsReqMem').html(totalRequestedMemory + ' MB');
  $('#groupStatsUsedMem').html(totalUsedMemory + ' MB');
  $('#groupStatsCPUTime').html(totalUsedWalltime);

  $('#groupStatsFrom').html($('#fromDate').val());
  $('#groupStatsTo').html($('#toDate').val());

  $('#groupStats').modal('show');
}
    
// Utilities
//Add two times together in the following format hh:mm:ss
function addTimes (startTime, endTime) {
  if (startTime != 0 && endTime != 0 && typeof startTime !== 'undefined' && typeof endTime !== 'undefined' && startTime >= 0 && endTime >= 0) {

    if (isNaN(startTime)) startTime = '00:00:00';
    if (isNaN(endTime)) endTime = '00:00:00';

    let a = startTime.split(':');
    let b = endTime.split(':');
  
    let aSeconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
    let bSeconds = (+b[0]) * 60 * 60 + (+b[1]) * 60 + (+b[2]);
  
    let totalSeconds = aSeconds + bSeconds;
  
    return formatCPUseconds(totalSeconds);
  }else{
    if (startTime != 0) {
      return startTime;
    }else if (endTime != 0) {
      return endTime;
    }else{
      return '00:00:00';
    }
  }
}

//Remove extra 0's from date
function zeroPadded(val) {
  return val >= 10 ? val : '0' + val;
}

//fadeOut the loading circles
function fadeLoaders() {
  $('#tableLoader').fadeOut(250);
  $('#myTable').fadeIn(400);
}

//Convert any memory notation to MB
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

//get CPU time in seconds
function getCPUseconds(cput) {
  let temp = cput.split(':');
  let seconds = (+temp[0]) * 60 * 60 + (+temp[1]) * 60 + (+temp[2]);
  return seconds;
}

function formatCPUseconds(totalSeconds) { 
  hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  minutes = Math.floor(totalSeconds / 60);
  seconds = totalSeconds % 60;

  return `${zeroPadded(hours)}:${zeroPadded(minutes)}:${zeroPadded(seconds)}`;
}

Object.size = function(obj) {
  var size = 0, key;
  for (key in obj) {
      if (obj.hasOwnProperty(key)) size++;
  }
  return size;
};

function downloadCSV(obj) {
  let csv = '';
  let headers = [];

  Object.keys(obj).forEach(value => {
    Object.keys(obj[value]).forEach(key => {
      headers.push(key);
    });
  });

  //clear duplicates
  headers = Array.from(new Set([ ...headers ]));

  for (var i = 0; i < headers.length; i++) {
    if (i == headers.length - 1) {
      csv += `${headers[i]}\n`;
    }else{      
      csv += `${headers[i]},`;
    }
  }

  //transform obj to CSV then start a download.
  let str = '';
  for (var i in obj) {
    for (var j in obj[i]) {
      str += obj[i][j] + ',';
    }
    str = str.replace(/,\s*$/, "");
    csv += str + '\n';
    str = '';
  }

  let blob = new Blob([csv], {type: 'text/csv'});
  if(window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(blob, 'export.csv');
  }
  else{
      let elem = window.document.createElement('a');
      elem.href = window.URL.createObjectURL(blob);
      elem.download = 'export.csv';        
      document.body.appendChild(elem);
      elem.click();        
      document.body.removeChild(elem);
  }

}

function exportCSV() {
  downloadCSV(downloadContents);
}

function exportAllCSV() {
  downloadCSV(dataSetObject.data);
}
