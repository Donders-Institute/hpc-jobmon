# Donders Institute hpc-jobmon
### What is this about?
I am Ramon Robben.
For my internship I have been assigned to create this project.
This project focusses on an interface to monitor your jobs on a web interface.
The goal should be an easy to use interface for HPC cluster users so that they can see the status of their job anywhere.

### HPC_Api
The HPC_Api is a REST Api that connects to a MySQL Database with all neccesary information.
This information is currently collected by a python script that runs every 30 minutes.
This python script collects various information about jobs and their attributes.
It saves them into the MySQL Database to make the information easily accesible.

### HPC_Website
The HPC_Website is the website itself.
It handles the logins and the requests that are sent to the API to get the information for a specific user.
It also shows the user a nice interface in which they can see information about their jobs.

Logging in with an Admin account will show you a different page with statistics about the usuage of the HPC.

### Understanding Infrastructure

Currently there are a few services and scripts running.
To help you get a better understanding of how they communicate and what there purpose is I will name them and explain what they do.

- Python Script is just a Python Script
- API is an RESTful API made with NodeJS
- Front-End is a webserver made with NodeJS that shows the users a page with info.

__MySQL Database__ : This Database contains all the information about the users jobs. This database is structured in a way so that the amount of duplicated data is very minimal.

__The Python Script__ : The python scrypt is collecting job information from the qstat -x command. That data is then inserted into the MySQL Database. The interval at which the script runs is currently set to every 30 minutes using a cronjob.

__The API__ : The API handles all the requests for data. It executes a query in the database and sends the results to the client making the request along with a status code.

__The Front-End__ : The Front-End sends a nicely styled page to the client. The client can then click on certain items on the HTML page and it will execute an AJAX POST Request to the Front-End webserver. The Front-End webserver checks if the user is authenticated and then makes the actual request to the API and forwards the response to the client.

Heres a picture I made to explain the infrastructure. It might not be 100% accurate but it will at least give you an idea of how the structure is setup.

![Image of Infrastructure](https://www.mupload.nl/img/rfxd8vxa.png)

For more indepth information of the systems go to the groupshare _TG\Projects\Project HPC-Jobmon_
