# Script to help find interesting missing variants

## Read me first!

You should **NEVER** run code taken randomly on the internet.  
If you plan to run this code, you SHOULD read it all.  
This code is not meant to harm you in any way and is published without any warranty that it will do what is expected.  
If you're still interested: GL HF.

## How to use the script
Before running the script, you should go over the options listed in the file named config.py. The main options to modify are the "player", "username" and "password" options. If you do not have a secondary account to put in the "username" and "password" options, you will need to make one. I may include a default one at some point that we could all use. You should find documentation for the other options in the config.py file itself.  
To execute the script, you can use the following command :
```bash
python missing-hanabi.py
```
This previous command is the way most users are going to use the script. For a few very special cases, the script also supports optional arguments. The optional arguments will modify who is going to be taken into consideration to find a missing variant. By default, the script is going to find your pre-game table and use your current table partners. If you are not in a pre-game, it will try to find one of your running or completed game to use as a base. If there are multiple, there is no way for you to choose which one it will use. The optional arguments follow three patterns :
* +Username
* Username
* -Username  

The first one (+ prefix) will add that user to the list of users that you are searching a variant for.  
The second one (no prefix) will replace that user with a user that has played no game, effectively removing that player from consideration.  
The third one (- prefix) will remove that user from the list.

An example: Let's say that you (Alice) are in a review with Bob and Cathy. You know that Bob wants to leave, and Donald wants to join. Donald, a very experienced player, also told you that he is not score hunting and doesn't mind playing any variants. As you're reaching the end of the review, you can use the following to get the list of missing variants for the three of you, for the next game : 
```bash 
python missing-hanabi.py -Bob +Donald Donald
```
The ordering of the arguments is not important, so the following would do the same :
```bash
python missing-hanabi.py -Bob Donald +Donald
```
If you had waited for the pre-game lobby where you would be joined by Cathy and Donald, you could simply used the following :
```bash
python missing-hanabi.py Donald
```

## How to install the script

### Using the Binder web service

Binder is a service that offers a hosted JupyterHub environment in your browser, allowing you to execute code without installing anything on your computer.  
You can click on this button to access it :
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/N1trate/missing-hanabi/HEAD?labpath=binder.ipynb)

You should then follow instructions found in the notebook to continue.

### Installing locally

* Linux: You should know what to do
* Windows: I don't know what to do
* Mac: I don't know why you do

Jokes aside, everybody's computer and setup is going to be different, but you may be able to follow most of these steps to get it to work:
* (Optional) Use a python environment manager. You may want to investigate venv, virtualenv or even conda. This is to separate the different installations and libraries that you could need in different projects.
* Either clone/download the repository, or download the two important pieces : missing-hanabi.py and config.py. You could optionally download requirements.txt.
* Install the required libraries (listed in requirements.txt) in your environment. If you have the file locally, you should be able to use the following : 
    ```bash
    pip install -r requirements.txt
    ```
* Configure your personal settings in the config.py file. Save the file afterward.
* Execute the script as explained in a previous section.

P.S. On Linux, you can make the script executable (chmod +x) and add a link to it in /usr/local/bin or ~/.local/bin if it exists and part of your PATH (ln -s \<where-the-script-is> /usr/local/bin/missing). You should then be able to call `missing` from anywhere. Make sure you didn't already have a `missing` executable that was important.

## How to improve the script

This script is still very experimental. You may help improving it by opening issues or creating pull requests. I do not guarantee any timely answer, but will appreciate your help and opinion.