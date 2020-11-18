var firebase = require("firebase/app");
require("firebase/firestore");
const firebaseConfig = {} //replace this with the config json

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

async function addUserToDb(msg) {
    user = {
        chatId: msg.from.id,
        username: msg.from.username || '*no_username',
        first_name: msg.from.first_name || "*no_firstname",
        last_name: msg.from.last_name || "*no_lastname",
        lyrics: {},
        downloads: {}
    }
    docId = msg.from.id.toString()
    console.log(docId)
    db.collection('users').doc(docId).set(user, {
        merge: true
    })
    return user
}


async function editUserStats(msg, lyric_id, deezer_id) {
    docId = msg.from.id.toString()
    let user = db.collection('users').doc(docId)
    let getDoc = await user.get()
    if(!getDoc.exists){
        userData = await addUserToDb(msg)
    }
    else{
        userData = getDoc.data()
    }
    console.log(msg)
    userData = {
        ...userData,
        chatId: msg.from.id,
        username: msg.from.username || '*no_username',
        first_name: msg.from.first_name || "*no_firstname",
        last_name: msg.from.last_name || "*no_lastname",
        total_requests : (userData.total_requests || 0) + 1
    }
    
    if (lyric_id){
        userData.lyrics[lyric_id] = (userData.lyrics[lyric_id] || 0) + 1
    }
    if (deezer_id){
        userData.downloads[deezer_id] = (userData.downloads[deezer_id] || 0) + 1
    }

    user.set(userData, {
        merge: true
    })


}


module.exports = {
    db,
    addUserToDb,
    editUserStats
}