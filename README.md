# Donders Institute hpc-jobmon
### What is this about?
> I am Ramon Robben.
> For my internship I have been assigned to create this project.
> This project focusses on an interface to monitor your jobs on a web interface.
> The goal should be an easy to use interface for HPC cluster users so that they can see the status of their job anywhere.

### HPC_Api
> The HPC_Api is a REST Api that connects to a MySQL Database with all neccesary information.
> This information is currently collected by a python script that runs every 30 minutes.
> This python script collects various information about jobs and their attributes.
> It saves them into the MySQL Database to make the information easily accesible.

### HPC_Website
> The HPC_Website is the website itself.
> It handles the logins and the requests that are sent to the API to get the information for a specific user.
> It also shows the user a nice interface in which they can see information about their jobs.
