# er-diagram-creator

It is an application that generates the er-diagram out of mongoose schema files in project. 
The app auto-detect files with .model.js extension among the project and extract the data schema, relations and additional options.
The result is an er-diagram with all fields, types and connections between collections.
Result is saved in folder - savedDiagram. Open index.html and you will see result.

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
Move to project root. Open terminal. Enter `npm start`.
Open browser. Enter url - `http://localhost:8081/`.
You will see list. List has all directories in your homedir.
Enter path to project. Click Submit.
You will see all folders and files of project.
Now you should choose model files.
  First way - you can find them manually by dbclick.
  Best way - you can select all files by extention. Click on project, enter extention, click on Select.
Then you will see list - Selected models.
Click - Send files
  If some file isn't model - app will tell you about this.
  If file with model use custom global function, you should insert this function to ./app/globals.js.
  App build diagram only from files which are exportible, and have `const someModel = new Schema({ ... })`
Then you will overturned on ER page, where you will see your diagram.
If your project has many models, you can unravel them and save result.
Result will save in savedDiagram folder.
Go to the folder. Open index.html
If result is not satisfactory - move to front-page `http://localhost:8081/` and click Edit button.
Then you will have ability to change ER-diagram
