# er-diagram-creator

It is an application that generates the er-diagram out of mongoose schema files in project.
The app auto-detect files with .model.js extension among the project and extract the data schema, relations and additional options.
App can extract models from remote db, remote project repositories and local projects in zip format
To create er-diagram every user should register. Then he/she has ability not only create, but download or even share diagram with friends.
Provided gitlab or indeema.gitlab authorization.

## Requirements

You will only need Node.js and npm.

### Node

#### Node installation on Windows

Just go on [official Node.js website](https://nodejs.org/) and download the installer.
Also, be sure to have `git` available in your PATH, `npm` might need it (You can find git [here](https://git-scm.com/)).

#### Node installation on Ubuntu

You can install nodejs and npm easily with apt install, just run the following commands.

      $ sudo apt install nodejs
      $ sudo apt install npm

#### Other Operating Systems

You can find more information about the installation on the [official Node.js website](https://nodejs.org/) and the [official NPM website](https://npmjs.org/).

If the installation was successful, you should be able to run the following command.

    $ node --version
    v10.15.3

    $ npm --version
    6.4.1

If you need to update `npm`, you can make it using `npm`! Cool right? After running the following command, just open again the command line and be happy.

    $ npm install npm -g

## Install

    $ git clone git@git.indeema.com:yuriy.ivanyk/er-diagram-creator.git
    $ cd ./er-diagram-creator
    $ npm install

## Running the project

    $ npm start

## How to use?

If you want to run er-diagram-creator in local machine - move to project root. Open terminal. Enter `npm start`.
Open browser. Enter url - `http://127.0.0.1:8081/`.
You will see signUp/signIn page, where you can make authorization.
Then you will see your profile page. Here you can create, update, delete, share your diagram.
If you want to create diagram, just click on `Create diagram` menu and choose method you want.
If you want to see already created diagram - click `My diagrams`

Diagram creation

Local - compress your project in zip format, then upload it by app in `Local project` part.
After uploading app will show the content of file and give you ability to choose every model you want to generate
Now you should choose model files.
First way - you can find them manually by dbclick.
Best way - you can select all files by extention. Click on project, enter extention, click on Select.
Then you will see list - Selected models.
Click - Send files
If some file isn't model - app will tell you about this.
If file with model use custom global function, you should insert this function to ./app/globals.js.
App build diagram only from files which are exportible, and have `const someModel = new Schema({ ... })`
Then you will overturned on profile, where you will see your diagram.
Remore repository the same.

You can download digram, just choose diagram and click `Download diagram`. You will receive zip file. Extract it and open index.html file

If you share diagram with somebody by email, recipient will get 3-4 files, all `.js` files will have `.js.txt` extantion 
( Because .js or .zip is forbidden by gmail)

