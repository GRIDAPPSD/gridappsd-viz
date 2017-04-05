To set up your development environment for this application:

0. > cd <your path>/viz

1. > npm install -g typescript

2. > npm install -g typings

3. > npm install 

(Step 3 might not be necessary for this project)
4. Copy the directory /lib/@types/react-router into /node_modules/@types, replacing the existing /node_modules/@types/react-router directory.  
    
    When npm installs @types/react-router, the wrong version of @types/history (4.5.0 vs. the necessary 2.0.0) is installed as a sub-dependency. 
    I tried getting around this using the following:
        a. npm shrinkwrap - didn't work, gave up on it, would need to learn more about how shrinkwrap works
        b. Installing @types/history myself - The versions could not be found, which seems to make no sense.
        c. Committing /node_modules/@types/react-router to the repo and removing it from the package.json to
           keep it from being replaced on npm install. The .gitignore except pattern wasn't working. Why?

5. > cd <your path>/viz

6. > webpack 

    Note: if webpack is not installed on your machine, you can install it globally with this command:
    > npm install webpack -g 

    Note: for faster development, you may wish to webpack automatically in response to file changes. 
    To do this, run webpack with this command:
    > webpack --watch

7. > node server.js

    Note: for faster development, you may wish to restart Node automatically in response to file changes.
    To do this, install nodemon with this command:
    > npm install nodemon -g 

    And start the server using this command:
    > nodemon server.js

8. Development on this project will be much easier using Visual Studio Code, which understands TypeScript
   and will offer dot-complete, etc. You can download Visual Studio Code from here: https://code.visualstudio.com/