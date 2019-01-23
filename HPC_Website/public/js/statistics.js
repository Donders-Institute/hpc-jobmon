let data;

// index for the username is used as index to match with all other arrays
let users = []; // ["john", "theo", "casper"]
let r_mem = []; // [12000, 240000, 239302] requested memory in MB
let u_mem = []; // used_memory in MB
let u_wall = [];// walltime is in seconds
let groups = [] // ["MRI", "TG", "MRI"]

let table_data = [];

let user_table;

// To be able to download this data
let group_data;
let user_data;

// initialize function to run when page is loaded
$(document).ready(() => {
  $('#myTable').hide();
  set_filters();
  get_data(() => {
    users = get_users(data);
    format_data_to_arrays(data);
  
    console.log(table_data);

    // Initialize DataTable
    user_table = $('#myTable').DataTable( {
      data: table_data,
      columnDefs: [
        {
          "render": function (data, type, row) {
            if (type === 'display') {
              return data + ' MB';
            }else{
              return data;
            }
          },
          "targets": [2, 3]
        },
        {
          "render": function (data, type, row) {
            if (type === 'display') {
              return seconds_to_time(data);
            }else{
              return data;
            }
          },
          "targets": 4
        },
        {
          "render": function (data, type, row) {
            if (type === 'display') {
              return `<a href="#" onClick="set_user_modal_data('${data}');return false;">${data}</a>`;
            }else{
              return data;
            }
          },
          "targets": 1
        },
        {
          "render": function (data, type, row) {
            if (type === 'display') {
              return `<a href="#" onClick="set_group_modal_data('${data}');return false;">${data}</a>`;
            }else{
              return data;
            }
          },
          "targets": 0
        }
      ],
      columns: [
        { title: 'Group' },
        { title: 'User' },
        { title: 'Requested Mem' },
        { title: 'Used Mem' },
        { title: 'Used Walltime (seconds)' }
      ]
    });

    // special function to filter table realtime on requested memory
    // function is registered at the bottom of this page
    $('#minRequested').keyup( function() {
      user_table.draw();
    });

    hide_loader();
    $('#myTable').show();

  });
});

function get_data(callback) {
  $.ajax({
    type: "POST",  
    url: `/getStats`,
    data: {fromdate: $('#fromDate').val(), todate: $('#toDate').val(), jobstate: $('#jobState').val()}
  }).done((response)=>{
    console.log(`[get_data] Data:`);
    if (response.success) {
      console.log(response.data);
      data = response.data;
      callback();
    }else{
      console.log('success is false');
      console.log(response.data);
      hide_loader();
      alert('something went wrong. if this issue persists please let the administrator know');
    }
  }).fail((xhr)=>{
    console.log(`[get_data] Error: ${JSON.stringify(xhr)}`);
  });
}

// function executes all other functions to populate the arrays at the top
function format_data_to_arrays(data) {
  for (var i in users) {
    r_mem.push(get_r_mem_from_user(users[i], data));
    u_mem.push(get_u_mem_from_user(users[i], data));
    u_wall.push(get_used_walltime_seconds_from_user(users[i], data));
    groups.push(get_group_from_user(users[i], data));
  }

  for (var i in users) {
    table_data.push( [ groups[i], users[i], r_mem[i], u_mem[i], u_wall[i] ] );
  }

}

function get_users(rows) {
  let temp_user_array = [];
  for (var i in rows) {
    // only append if user is not yet in there
    if (!temp_user_array.includes(rows[i].euser)) temp_user_array.push(rows[i].euser);
  }
  return temp_user_array;
}

function get_r_mem_from_user(user, rows) {
  let memory = 0;
  for (var i in rows) {
    if (rows[i].euser == user) memory += mem_to_mb(rows[i].r_mem);
  }
  return memory;
}

function get_u_mem_from_user(user, rows) {
  let memory = 0;
  for (var i in rows) {
    if (rows[i].euser == user) memory += mem_to_mb(rows[i].used_mem);
  }
  return memory;
}

function get_used_walltime_seconds_from_user(user, rows) {
  let seconds = 0;
  for (var i in rows) {
    if (rows[i].euser == user) seconds += time_to_seconds(rows[i].used_walltime);
  }
  return seconds;
}

function get_group_from_user(user, rows) {
  let group = 'no group';
  for (var i in rows) {
    if (rows[i].euser == user) group = rows[i].egroup;
  }
  return group;
}


// Helper functions that do small tasks
function apply_filters() {
  show_loader();
  get_data(() => {
    refresh_table();
  });
}

function refresh_table() {
  $('#myTable').dataTable().fnClearTable();

  users = [];
  r_mem = [];
  u_mem = [];
  u_wall = [];
  groups = [];

  if (data.length <= 0) {
    alert('no data found.');
    hide_loader();
  }else{
    table_data = [];
    users = get_users(data);
    format_data_to_arrays(data);
    $('#myTable').dataTable().fnAddData(table_data);
    hide_loader();
  }
}

function get_modal_data_from_user(user) {
  let total_jobs = 0;
  let requested_memory = 0;
  let used_memory = 0;
  let used_walltime = '00:00:00';

  for (var i in users) {
    if (users[i] == user) {
      requested_memory = get_r_mem_from_user(users[i], data);
      used_memory = get_u_mem_from_user(users[i], data);
      used_walltime = get_used_walltime_seconds_from_user(users[i], data);
    }
  }

  // count jobs
  for (var i in data) {
    if (data[i].euser == user) total_jobs += 1;
  }

  return {user, total_jobs, requested_memory, used_memory, used_walltime};
}

function set_user_modal_data(user) {
  let u = get_modal_data_from_user(user);
  set_user_data(user);

  $('#userStatsLabel').html(u.user);
  $('#userStatsUser').html(u.user);
  $('#userStatsTotalJobs').html(u.total_jobs);
  $('#userStatsReqMem').html(u.requested_memory + ' MB');
  $('#userStatsUsedMem').html(u.used_memory + ' MB');
  $('#userStatsWalltime').html(seconds_to_time(u.used_walltime));

  $('#userStatsFrom').html($('#fromDate').val());
  $('#userStatsTo').html($('#toDate').val());

  $('#groupStats').modal('hide');
  $('#userStats').modal('show');
}

function set_group_modal_data(group) {
  let group_total_jobs = 0;
  let group_requested_memory = 0;
  let group_used_memory = 0;
  let group_used_walltime = 0;

  set_group_data(group);

  // put index of the user in the array so we can use it later to get the information
  let group_users = [];
  for (var i in users) {
    if (groups[i] == group) group_users.push(users[i]);
  }

  // loop through all users and generate the html
  // also count all the data of that user towards the group total
  $('#usersFromGroup').html('');
  for (var i in group_users) {
    let user_data = get_modal_data_from_user(group_users[i]);

    // count the data from the user towards the group total
    group_total_jobs += user_data.total_jobs;
    group_requested_memory += user_data.requested_memory;
    group_used_memory += user_data.used_memory;
    group_used_walltime += user_data.used_walltime;

    // append html table row with info of the user
    $('#usersFromGroup').append(`
    <tr>
      <td><a href="#" onClick="set_user_modal_data('${user_data.user}'); return false;">${user_data.user}</a></td>
      <td> ${user_data.total_jobs} </td>
      <td> ${user_data.requested_memory} MB</td>
      <td> ${user_data.used_memory} MB</td>
      <td> ${seconds_to_time(user_data.used_walltime)} </td>
    </tr>
  `);
  }

  $('#groupStatsLabel').html(group);
  $('#groupStatsGroup').html(group);
  $('#groupStatsTotalJobs').html(group_total_jobs);
  $('#groupStatsReqMem').html(group_requested_memory + ' MB');
  $('#groupStatsUsedMem').html(group_used_memory + ' MB');
  $('#groupStatsCPUTime').html(seconds_to_time(group_used_walltime));

  $('#groupStatsFrom').html($('#fromDate').val());
  $('#groupStatsTo').html($('#toDate').val());

  $('#groupStats').modal('show');
}

function set_filters() {
  console.log("[set_filters] setting filters");
  // Set defaults for the between dates filter to previous month and today.
  var now = new Date();
  var last = new Date();
  last.setDate(0);

  console.log(formatDate(last));
  console.log(formatDate(now));

  $('#fromDate').val(formatDate(last));
  $('#toDate').val(formatDate(now));

  console.log("[set_filters] done settings filters");
}

function seconds_to_time(seconds) {
  if (typeof seconds == "number" && seconds > 0) {
    hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;

    return `${zero_padded(hours)}:${zero_padded(minutes)}:${zero_padded(seconds)}`;
  }
  return "00:00:00";
}

function time_to_seconds(hhmmss) {
  if (typeof hhmmss == "string" && hhmmss.split(':').length == 3) {
    try {
      let temp = hhmmss.split(':');
      let seconds = (+temp[0]) * 60 * 60 + (+temp[1]) * 60 + (+temp[2]);

      if (isNaN(seconds)) return 0;

      return seconds;
    } catch (error) {
      console.log('Error occured while converting time to seconds.');
      console.log(error);
      return 0;
    }
  }
  return 0;
}

function mem_to_mb(mem) {
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

// add 0 infront of number if smaller than 10
function zero_padded(val) {
  return val >= 10 ? val : '0' + val;
}

//fadeOut the loading circles
function hide_loader() {
  $('#tableLoader').fadeOut(250);
  $('#myTable').fadeIn(400);
}

function show_loader() {
  $('#myTable').hide();
  $('#tableLoader').show();
}

function export_data_to_csv(type) {

  let csv = '';
  let data = '';
  let headers = 'Group,User,Requested memory,Used memory,Used walltime,\n';
  let isValidType = true;

  switch (type) {
    case 'all':
      data = table_data;
      console.log('all');
      headers = 'Group,User,Requested memory (MB),Used memory (MB),Used walltime (Seconds),\n';
      break;
    case 'user':
      data = user_data;
      break;
    case 'group':
      data = group_data;
      break;
    default:
      console.log('unspecified type');
      isValidType = false;
      break;
  }

  if (isValidType) {
    console.log('[Export data to csv] data:');
    console.log(data);

    csv += headers;

    for (let i in data) {
      for (let j in data[i]) {
        csv += data[i][j] + ','
      }
      csv += '\n';
    }
    
    console.log('Done exporting, Starting download');

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

}

function set_user_data(user) {
  user_data = [];
  for (var i in data) {
    if (data[i].euser == user) user_data.push([data[i].egroup, data[i].euser, data[i].r_mem, data[i].used_mem, data[i].used_walltime]);
  }
}

function set_group_data(group) {
  group_data = [];
  for (var i in data) {
    if (data[i].egroup == group) group_data.push([data[i].egroup, data[i].euser, data[i].r_mem, data[i].used_mem, data[i].used_walltime]);
  }
}

function formatDate(date) {
  var monthNames = [
    "01", "02", "03",
    "04", "05", "06", "07",
    "08", "09", "10",
    "11", "12"
  ];

  var day = date.getDate();
  var monthIndex = date.getMonth();
  var year = date.getFullYear();

  return year + '-' + monthNames[monthIndex] + '-' + day;
}

// function tests. write down functions to test if other functions work correctly

function test_time_to_seconds() {

  var inputs = ["", 0, 200, "test", "11:00", ":::", "NaN:NaN:NaN", "13:00:00", "99:88:77", "16:25:32"];
  var results = [];
  
  for (var i in inputs) {
    results.push( time_to_seconds(inputs[i]) > 0 );
  }
  
  // expected outcome = false, false, false, false, false, false, false, true, true, true
  return results;
}

// DataTable register special functions
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