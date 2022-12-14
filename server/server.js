const express = require("express");
const mongoose = require("mongoose");
const app = express()
const cors = require('cors')
const bcrypt = require('bcrypt');
const dotenv = require('dotenv')

dotenv.config()

// enable access to all origins
app.use(cors())

// allows for req.body to get Axios POST data
app.use(express.json())

main().catch(err => console.log(err));

// get URI from .env file


// connect to mongoDB database
async function main() {
    let URI = process.env.MONGO_ATLAS_URI
    mongoose.connect(URI);
}


/* ***************** SCHEMAS AND MODELS ***************** */

/* USER SCHEMA AND MODEL */
const userSchema = new mongoose.Schema({
    // Username and password
    username: String,
    password: String,
    // Array containing IDs of all boards belonging to user
    boardIds: [String]
});

const User = mongoose.model("user", userSchema);

/* BOARD SCHEMA AND MODEL */
const boardSchema = new mongoose.Schema({
    // Name of board
    boardname: String,
    // Array containing IDs of all notes belonging to board
    noteIds: [String]
});

const Board = mongoose.model("board", boardSchema);

/* NOTE SCHEMA AND MODEL */
const noteSchema = new mongoose.Schema({
    notename: String,
    // Background color (modifies CSS)
    color: String,
    // Number of references to note - default is 1
    linkcount: {type: Number, default: 1},
    contents: [String],
});

const Note = mongoose.model("note", noteSchema);


/* ***************** API ENDPOINTS ***************** */

/* USER API */

app.post('/api/create-user/:username/:password', function(req, res){
    // create a user, if and only if username is not in use
    const newUsername = req.params.username
    const newPassword = req.params.password
    const saltRounds = 10;
    
    function createUser() {
        // create 3 new boards for the new user
        const newBoard1 = new Board({
            boardname: "Home"
        })

        const newBoard2 = new Board({
            boardname: "Shared"
        })
        
        const newBoard3 = new Board({
            boardname: "Search Results"
        })
        
        // store the board id's in array to store for user
        const boardIDs = [newBoard1._id, newBoard2._id, newBoard3._id]

        // store the boards in an array to insert all of them into database
        const boardsToInsert = [newBoard1, newBoard2, newBoard3]

        // insert the 3 boards created above
        Board.insertMany(boardsToInsert)
        
        bcrypt.hash(newPassword, saltRounds, function(err, hash) {
            // Store hash in your password DB.

        
            // create user document
            const newUser = new User({
                username: newUsername,
                password: hash,
                boardIds: boardIDs
            })

            // save the new user (which points to the 3 default boards)
            newUser.save(function(err) {
                if (err) {
                    res.send(err)
                }
                else {
                    res.send(true)
                }
            })
        }); 

    }

    User.findOne({username: newUsername}, function(err, foundUser) {
        if (err) {
            res.send(err)
        }
        else {
            if (foundUser == null){
                createUser()
            }
            else{
                res.send(false)
            }
        }
    })
})

app.get('/api/valid-login/:username/:password', function(req, res) {
    // sends 'true' if password matches for the user, 'false' if user doesn't exist or password doesn't match

    const searchUsername = req.params.username
    const password = req.params.password

    User.findOne({username: searchUsername}, function(err, foundUser) {
        if (err) {
            res.send(err)
        }
        else {
            if (foundUser == null){
                res.send(false)
            }
            else{
                // res.send(foundUser.password == password)
                bcrypt.compare(password, foundUser.password, function(err, result) {
                    
                    if (err) {
                        res.send(err)
                    }
                    else {
                        res.send(result)
                    }
                });
            }
        }
    })

})

/*
// sends back all users & passwords for testing purposes
app.get('/api/all-users', function(req, res) {
    User.find(function(err, users) {
        if (err) {
            console.log(err)
            res.send("Error!")
        }
        else {
            // users is an array of JavaScript user objects
            res.send(users)
        }
    })
})
*/

/* BOARD API */

app.post('/api/create-board', async function(req,res){
    // create a board, if and only if that user doesn't already have a board with that name
    const uname = req.body.username
    const newBoardName = req.body.boardname
    
    async function createBoard() {
        // create new board with inputted title
        const newBoard = new Board({
            boardname: newBoardName
        })

        // grab the board ID
        const newBoardId = String(newBoard._id)

        // find the user and update its boardIds array to include the created board
        await User.updateOne(
            {username: uname}, 
            {$push: {boardIds: [newBoardId]}}
        )

        // save that new board into the database
        newBoard.save(function(err) {
            if (err) {
                res.send(err)
            }
            else {
                res.send(true)
            }
        })
    }

    User.findOne({username: uname}, async function(err, foundUser) {
        if (err) {
            res.send(err)
        }
        else {
            // user does not exist
            if (foundUser == null){
                res.send(false)
            }
            // user exists
            else{
                const allBoardIds = foundUser.boardIds
                Board.findOne({_id: {$in : allBoardIds}, boardname: newBoardName}, async function(err, foundBoard){
                    if (err) {
                        res.send(err)
                    }
                    else {
                        // if the board doesn't exist for that user, create the board
                        if (foundBoard == null) {
                            createBoard()
                        }
                        // otherwise, false
                        else {
                            res.send(false)
                        }
                    }
                })
            }
        }
    })
});

// returns all the boards for a specific user
app.get("/api/get-all-boards/:username", function(req, res) {
    const username = req.params.username

    // find user given the username
    User.findOne({username: username})
    .then(function(foundUser) {

        // get board ID array for found user
        const allBoardIds = foundUser.boardIds

        // finds all boards with ID's in the allBoardIds array
        Board.find({_id: {$in: allBoardIds}}, function(err, allBoards) {
            if (err) {
                res.send(err)
            }
            else {
                // send the array of all boards
                res.send(allBoards)
            }
        })
    })
    .catch(function(err) {
        res.send(err)
    })

})

app.post('/api/delete-board', function(req, res) {
    // searching for a board
    const boardID = req.body.boardID
    const uname = req.body.username

    // handle notes contained in board
    Board.findById(mongoose.Types.ObjectId(boardID), async function(err, foundBoard){
        if (err) {
            res.send(err)
        }
        else {
            // if the board is present:
            if (foundBoard != null) {
                // for each note in the board, decrement link count, and delete if no more links
                const allNoteIds = foundBoard.noteIds
                await Note.updateMany({_id: { $in : allNoteIds}}, {$inc: { linkcount: -1 }})
                await Note.deleteMany({_id: { $in : allNoteIds}, linkcount: 0})
            }
        }
    })

    // remove board from user
    User.updateOne({username: uname}, {$pull: {boardIds: boardID}}, function(err){
        if (err) {
            res.send(err)
            return
        }
    })

    // delete board
    Board.deleteOne({_id: boardID}, function(err, result) {
        if (err) {
            res.send(err)
        }
        else {
            if (result.deletedCount == 1){
                res.send(true)
            }
            else {
                res.send(false)
            }
        }
    })
})

// sends back all boards
// app.get('/api/all-boards', function(req, res) {
//     Board.find(function(err, boards) {
//         if (err) {
//             console.log(err)
//             res.send("Error!")
//         }
//         else {
//             // boards is an array of JavaScript board objects
//             res.send(boards)
//         }
//     })
// })

/* NOTE API */

app.get('/api/get-all-notes/:boardID', function(req, res)
{
    // return all notes in a board, matching the order of the IDs in the board
    const boardID = req.params.boardID

    Board.findOne({_id: boardID}, async function(err, foundBoard) {
        if(err){
            res.send(err)
        }
        else{
            const allNoteIds = foundBoard.noteIds
            const allNotes = []
            for (const noteID of allNoteIds) {
                // for each note ID, in order, find the corresponding note and push it to the array
                const foundNote = await Note.findOne({_id: noteID})
                if (foundNote != null){
                    allNotes.push(foundNote)
                }
            }
            res.send(allNotes)
        }
    })

})

app.post('/api/create-note', async function(req,res){
    const newNoteName = req.body.notename
    const newContent = req.body.content
    const boardID = req.body.boardID

    const newNote = new Note({
        notename: newNoteName,
        contents: [newContent]
    })

    const newNoteID = newNote._id

    await Board.updateOne(
        {_id: boardID}, 
        
        // push the new note ID to the FRONT of the noteIds array
        { $push: {
            noteIds: {
                $each: [newNoteID],
                $position: 0
            }
        }}
    )

    newNote.save(function(err) {
        if (err) {
            res.send(err)
        }
        else {
            res.send(newNote)
        }
    })
});

app.post("/api/update-note", function(req, res) {
    const newNoteName = req.body.notename
    const newContent = req.body.content
    const noteID = req.body.noteID

    Note.updateOne(
        // update note with the ID specified
        {_id: noteID},

        // set notename and content attributes to updated versions
        { 
            $set: {
                notename: newNoteName,
                contents: [newContent]
            }
        }
    )
    .then(function(obj) {
        res.send("Updated object")
    })
    .catch(function(err) {
        res.send(err)
    })
}) 

app.post('/api/delete-note/', function(req, res) {
    const noteID = req.body.noteID
    const boardID = req.body.boardID

    // ensure the board is in the database
    Board.findById(mongoose.Types.ObjectId(boardID), function(err, foundBoard){
        if (err){
            res.send(err)
            return
        }
        else {
            if (foundBoard == null){
                res.send(false)
                return
            }
            else{
                if (foundBoard.noteIds.includes(noteID)){
                    // update specified board
                    Board.updateOne({_id: boardID}, {$pull: {noteIds: noteID}}, function(err){
                        if (err){
                            res.send(err)
                            return
                        }
                    })
                    Note.findById(noteID, function(err, foundNote){
                        if (err){
                            res.send(err)
                        }
                        else{
                            if (foundNote == null){
                                res.send(false)
                            }
                            else{
                                // If note currently has linkcount 1, delete it
                                if (foundNote.linkcount == 1){
                                    Note.deleteOne({_id: noteID, linkcount: 1}, function(err) {
                                        if (err) {
                                            res.send(err)
                                            return
                                        }
                                    })
                                }
                                // Otherwise, decrement the link count
                                else {
                                    Note.findByIdAndUpdate(mongoose.Types.ObjectId(noteID), {$inc: { linkcount: -1}}, { new: true }, function(err){
                                        if (err){
                                            res.send(err)
                                            return
                                        }
                                    })
                                }
                                res.send(true)
                            }
                        }
                    })
                }
                else {
                    res.send(false)
                }
            }
        }
    })
})

app.post('/api/share-note', function(req, res){
    const noteID = req.body.noteID
    const destUser = req.body.destUser

    // ensure the note is in the database
    Note.findById(mongoose.Types.ObjectId(noteID), function(err, foundNote) {
        if (err) {
            res.send(err)
        }
        else {
            if (foundNote == null){
                res.send(false)
            }
            else {
                User.findOne({username: destUser}, function(err, foundUser){
                    if (err) {
                        res.send(err)
                    }
                    else {
                        // if destUser is in the databse, get the id of their "shared" board
                        // if not, return false
                        if (foundUser == null){
                            res.send(false)
                        }
                        else {
                            // find the "Shared" board's ID
                            const allBoardIds = foundUser.boardIds
                            Board.findOne({_id: { $in : allBoardIds}, boardname: "Shared"}, function(err, foundBoard){
                                if (err) {
                                    res.send(err)
                                }
                                else {
                                    if (foundBoard == null) {
                                        res.send(false)
                                    }
                                    else {
                                        if (!foundBoard.noteIds.includes(noteID)){
                                            Board.findByIdAndUpdate(foundBoard._id, {$push: {noteIds: [noteID]}}, function (err){
                                                if (err){
                                                    res.send(err)
                                                }
                                            })
                                            Note.findByIdAndUpdate(mongoose.Types.ObjectId(noteID), {$inc: { linkcount: 1} }, function(err, ){
                                                if (err) {
                                                    res.send(err)
                                                }
                                                else{
                                                    res.send(true)
                                                }
                                            })
                                        }
                                        else{
                                            res.send(true)
                                        }                                        
                                    }
                                }
                            })
                        }
                    }
                })
            }
        }
    })
})

// function for adding notes to other boards by ID
app.post('/api/add-to-board', function(req, res){
    const noteID = req.body.noteID
    const boardID = req.body.boardID

    // ensure the note is in the database
    Note.findById(mongoose.Types.ObjectId(noteID), function(err, foundNote) {
        if (err) {
            res.send(err)
        }
        else {
            if (foundNote == null){
                res.send(false)
            }
            else {
                // find the requested board's ID
                Board.findById(mongoose.Types.ObjectId(boardID), async function(err, foundBoard){
                    if (err) {
                        res.send(err)
                    }
                    else {
                        if (foundBoard == null) {
                            res.send(false)
                        }
                        else {
                            if (!foundBoard.noteIds.includes(noteID)){
                                Board.findByIdAndUpdate(foundBoard._id, {$push: {noteIds: [noteID]}}, function (err){
                                    if (err){
                                        res.send(err)
                                    }
                                })
                                Note.findByIdAndUpdate(mongoose.Types.ObjectId(noteID), {$inc: { linkcount: 1} }, function(err, ){
                                    if (err) {
                                        res.send(err)
                                    }
                                    else{
                                        res.send(true)
                                    }
                                })
                            }
                            else{
                                res.send(true)
                            }                                        
                        }
                    }
                })
            }
        }
    })
})

/* MOVE NOTE */
app.post('/api/shift-left', function(req, res) {
    // shifts note at specified index left and returns true if order is changed
    const boardID = req.body.boardID
    const index = req.body.ind

    if (index === 0){
        res.send(false)
    }
    else{
        Board.findOne({_id: boardID}, function(err, foundBoard) {
            if (err) {
                res.send(err)
            }
            else {
                const noteIDs = foundBoard.noteIds

                // switch noteID with the one before it
                let temp = noteIDs[index - 1]
                noteIDs[index - 1] = noteIDs[index]
                noteIDs[index] = temp
                
                // save new array into the database
                Board.updateOne({_id: boardID}, { $set: {noteIds: noteIDs}}, function(err) {
                    if (err) {
                        res.send(err)
                    }
                    else {
                        res.send(true)
                    }
                })
            }
        })
    }
})

app.post('/api/shift-right', function(req, res) {
    // shifts note ID right and returns new array of notes in correct order
    const boardID = req.body.boardID
    const index = req.body.ind
    
    Board.findOne({_id: boardID}, function(err, foundBoard) {
        if (err) {
            res.send(err)
        }
        else {
            const noteIDs = foundBoard.noteIds

            // if it's the last element, we can't shift right
            if (noteIDs.length === index + 1){
                res.send(false)
            }
            else{
                // switch noteID at index with one after it
                let temp = noteIDs[index + 1]
                noteIDs[index + 1] = noteIDs[index]
                noteIDs[index] = temp

                // save new array into the database
                Board.updateOne({_id: boardID}, { $set: {noteIds: noteIDs}}, function(err) {
                    if (err) {
                        res.send(err)
                    }
                    else {
                        res.send(true)
                    }
                })
            }
        }
    })    
})


// sends back all notes for testing purposes
// app.get('/api/all-notes', function(req, res) {
//     Note.find(function(err, notes) {
//         if (err) {
//             console.log(err)
//             res.send("Error!")
//         }
//         else {
//             // users is an array of JavaScript user objects
//             res.send(notes)
//         }
//     })
// })


/* SEARCH FUNCTIONALITY */
app.post("/api/search-user", async function(req, res) {
    const query = req.body.query.toLowerCase()
    const username = req.body.username

    // find user who made search request
    const foundUser = await User.findOne({username: username})

    // if the user doesn't exist, send false
    if (foundUser == null){
        res.send(false)
    }
    // otherwise, carry out search
    else{
        // get all of the user's boards
        const allBoardIds = foundUser.boardIds

        const allBoards = await Board.find({_id: {$in: allBoardIds}})

        const allNoteIds = []
        for (const board of allBoards){
            // append all the note id arrays together into one gigantic note id array
            // do not check notes already in the Search Results board
            if (board.boardname != "Search Results"){
                allNoteIds.push(...board.noteIds)
            }
        }

        // get all of the user's notes
        const allNotes = await Note.find({_id: {$in: allNoteIds}})

        const search_results = []

        // search every note for the query string (case insensitive)
        for (const note of allNotes) {
            if ((note.notename).toLowerCase().includes(query) || (note.contents[0].toLowerCase().includes(query))){
                search_results.push(note._id)
            }
        }

        // update the Search Results board
        Board.updateOne({_id: {$in: allBoardIds}, boardname: "Search Results"}, {noteIds: search_results}, function(err, results){
            if (err){
                res.send(err)
            }
            else {
                // if the board has been changed, send true
                if (results.modifiedCount == 1){
                    res.send(true)
                }
                // otherwise, send false
                else {
                    res.send(false)
                }
            }
        })
    }
})

app.listen(8000, function(req, res) {
    console.log("Listening on port 8000")
})
