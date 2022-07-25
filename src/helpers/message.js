function isInline(msg) {
    if (msg.reply_markup)
        return true
    return false
}


function taggedBroadcast(msg){
    if (msg.text) {
        if (msg.text.indexOf('THISISABROADCASTTAG') > 0) {
            return true
        }
    } else if (msg.caption) {
        if (msg.caption.indexOf('THISISABROADCASTTAG:') > 0) {
            return true
        }
    }
    return false
}


function sentFromAdmin(msg){
    //TODO: make this a request from database
    chatId = msg.chat.id
    admins = []//place the admin id here or request from a db,  your choice. I put it here since instead of querying it again and again
    if (admins.includes(chatId))
        return true
    else
        return false
}


function isBroadcast(msg) {
    if (!taggedBroadcast(msg))
        return false
    if (sentFromAdmin(msg))
        return true
    else
        return false
}


module.exports = {
    isBroadcast,
    sentFromAdmin,
    isInline
}
