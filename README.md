# Project Title

It is an application for UDB (can be implemented for furure projects too) that generates the er-diagram (image) out of mongoose schema files in project. The app auto-detect files with .model.js extension among the project and extract the data schema, relations and additional options. The result is an er-diagram with all fields, types and connections between collections represented in any visual way.
Result is saved in folder - savedDiagram. Open index.html and you will see result.

## Requirements

You will only need Node.js and npm.

### Node
- #### Node installation on Windows

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
