# HPC-Jobmon API Endpoints

### GET /user/:user/jobs

Get all jobs from a user.

Response:

    {
      "success": true,
      "data": [
        {
           "ID": "18320032",
           "insert_datetime": "2018-11-28T08:30:01.000Z",
           "euser": "dorflo",
           "job_state": "r",
           "job_name": "stdin",
           "queue": "interactive",
           "exit_status": "0"
        },
        {
           "ID": "18320347",
           "insert_datetime": "2018-11-28T08:30:01.000Z",
           "euser": "dorflo",
           "job_state": "r",
           "job_name": "stdin",
           "queue": "interactive",
           "exit_status": "0"
        }
      ]
    }

success is false if something went wrong.

Parameters can be given such as:

- ?fromdate=2018-10-01&todate=2018-11-01
- ?job_state=r (valid job states are q, c, r)
- ?limit=5 (get a max of 5 jobs)
- ?offset=10 (skip the first 10 jobs)

The first 2 parameters work for most endpoints where you would need them. The last two only work for this request.


### GET /user/:user/jobs/count

Count all jobs ans group them by job_state.

Response:

    {
      "success": true,
      "data": [
        {
            "count": 2,
            "job_state": "q"
        },
        {
            "count": 6273,
            "job_state": "c"
        },
        {
            "count": 14,
            "job_state": "r"
        }
      ]
    }


### GET /user/:user/jobs/blocked

Get all blocked jobs from a user.

    {
      "success": true,
      "data": [
        {
            "id": "18320353",
            "reason": "ActivePolicy:job 18320353 violates active SOFT MAXJOB limit of 2 for class interactive user partition ALL (Req: 1  InUse: 2)"
        },
        {
            "id": "18320350",
            "reason": "ActivePolicy:job 18320350 violates active SOFT MAXJOB limit of 2 for class interactive user partition ALL (Req: 1  InUse: 2)"
        }
      ]
    }

### GET /user/:user/jobs/blocked/count

Count all the blocked jobs of a user.

    {
      "success": true,
      "data": {
        "count": 2
      }
    }


### GET /jobs/:job_id

Get job information from a job_id

    {
      "success": true,
      "data": [
        {
            "ID": "18320032",
            "insert_datetime": "2018-11-28T09:00:02.000Z",
            "euser": "dorflo",
            "job_state": "r",
            "job_name": "stdin",
            "queue": "interactive",
            "exit_status": "0",
            "submit_host": "mentat003.dccn.nl",
            "exec_host": "dccn-c043.dccn.nl/13",
            "session_id": "20959",
            "r_walltime": "48:00:00",
            "r_mem": "30gb",
            "used_walltime": "01:14:15",
            "used_cput": "00:57:00",
            "used_mem": "26543364kb",
            "used_vmem": "28721404kb"
        }
      ]
    }

### GET /jobs/:job_id/extra

Get some extra job information from a job_id

    {
      "success": true,
      "data": [
        {
            "ID": "18320032",
            "insert_datetime": "2018-11-28T09:00:02.000Z",
            "euser": "dorflo",
            "job_id": "18320032.dccn-l029.dccn.nl",
            "job_owner": "dorflo@mentat003.dccn.nl",
            "egroup": "mrstats",
            "r_feature": "0",
            "r_reqattr": "0",
            "r_neednodes": "0",
            "r_ncpus": "1",
            "output_path": "mentat003.dccn.nl:/home/mrstats/thowol/aims_li/anats/mri/results/fsl_flameo/stdin.o18320032",
            "ctime": "1543337060",
            "mtime": "1543337098",
            "qtime": "1543337060",
            "etime": "1543337060",
            "start_time": "1543337098",
            "start_count": "1",
            "init_work_dir": "/home/mrstats/thowol/aims_li/anats/mri/results/fsl_flameo"
        }
      ]
    }
