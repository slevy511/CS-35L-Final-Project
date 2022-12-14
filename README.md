# CS-35L-Final-Project
Project Group 35 Fall 2022

## Stickies App
Our project is a web application that gives users the ability to create named boards of sticky notes. Users make an account and create sticky notes that they can organize into various personal boards. Users can sort and save sticky notes, and then search to find them.

### .env file
Make sure you create a `.env` file within the `server` directory — it contains the MongoDB Atlas URI that can't be pushed onto GitHub for security reasons, so you'll have to create it in order to run the project locally.

Inside the `.env` file, add this line:
```
MONGO_ATLAS_URI="INSERT URI HERE"
```
So if your mongo atlas URI was `mongodb+srv://test:test@cluster0.notarealdb.mongodb.net/fake_db?retryWrites=true`

your `.env` file should contain
```
MONGO_ATLAS_URI="mongodb+srv://test:test@cluster0.notarealdb.mongodb.net/fake_db?retryWrites=true"
```

**Note: both frontend and backend must be running simultaneously for the application to work**

## How to Run the Frontend (client directory)
1. Make sure you have an up-to-date version of Node installed. `node --version` must be at least 16.17.0, which is the LTS version.
2. `cd` into a local directory you want to work in
3. Type `git clone https://github.com/slevy511/CS-35L-Final-Project.git` to clone the repository
4. Type `cd CS-35L-Final-Project` to change into the repo directory
5. Type `cd client` to change into the `client` directory
6. Type `npm install` to install client dependencies
7. Run `npm start` to start the client application
8. The application should now be running on `localhost:3000` in your browser

## How to Run the Backend (server directory)
1. `cd` into `server` directory
2. run `npm install` to install server dependencies
3. run `nodemon server.js` to run the server application. `nodemon` updates as you save your `server.js` code, which is nice. If it doesn't work, use `node server.js` but note that you have to rerun it every time you make changes. 

## How to Contribute to the Project
**Make sure you have cloned the repository and ran the application by following the instructions above**
1. `cd` into your local clone of the repository
2. Make sure you have the latest version of the repository by running `git pull`. Forgetting to do so may result in merge conflicts!
3. Create a branch by typing `git branch <branch-name>`
4. Push the branch to the remote repository with: `git push -u origin <branch-name>`
5. Then switch to that branch by typing `git checkout <branch-name>` (You can always check which branch you're in by typing `git branch`)
6. Make the changes locally (make sure to commit often!)
7. Commit to your local branch by typing:
    `git add .`
    `git commit -m "useful-commit-message"`
8. Push your changes to the remote respository:
    `git push -u origin <branch-name>`
9. Once you're finished working on the branch, commit your changes locally and remotely.
10. Submit a **pull request**

## Submitting a Pull Request
The easiest way is to visit 
https://github.com/slevy511/CS-35L-Final-Project/branches
and select "New Pull Request" next to your branch

Once you've submitted the pull request, we can discuss and review potential changes before merging it with the main branch.

