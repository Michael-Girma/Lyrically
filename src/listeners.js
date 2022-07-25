process.env.NTBA_FIX_319 = 1;

const Tgfancy = require('tgfancy')
const express = require('express')
const app = express()

const message = require('./helpers/message')
const utils = require('./helpers/utils')
const genius = require('./api/genius')
const deezer = require('./api/deezer')
const keyboards = require('./helpers/keyboards')
const {
    db,
    addUserToDb,
    editUserStats
} = require("./db/database")

const Port = process.env.PORT || 3000
const token = process.env.BOT_TOKEN //token goes here
const bot = new Tgfancy(token, {
    polling: true,
    tgfancy: {
        orderedSending: true,
        textPaging: false
    }
});


const MAX_MESSAGE_SIZE = 4095
const BOT_URL = process.env.BOT_URL
const DESCRIPTION = 'Okay press "Try inline search" to search for lyrics or Hit "Download a song" and type in a song title to search for the track. You can also just type in a song title and I\'ll get you the popular hit.'


let inChatRequests = {}


async function getCollection(name) {
    const snapshot = await db.collection(name).get()
    return snapshot.docs.map(doc => {
        return {
            docId: doc.id,
            data: doc.data()
        }
    })
}


async function handleInChatRequest(msg) {
    callback_data = msg.reply_markup.inline_keyboard[0][0].callback_data
    console.log('[X] recieved in bot request' + callback_data)
    if (callback_data.indexOf('Genius:') > 0) {
        await bot.sendChatAction(msg.chat.id, 'typing')
        songId = callback_data.split(":")[1]
        songInfo = await genius.getSongInfoById(songId);
        lyrics = await genius.scrape(songInfo.url)
        keyboard = keyboards.lyrics(songInfo.title, songInfo.title)
        options = keyboards.makeReplyKeyboard(keyboard)
        messages = utils.chunkSubstr(`Lyrics of ${songInfo.full_title} \n\n${lyrics}`, MAX_MESSAGE_SIZE)
        console.log(messages.length)
        for (i = 0; i < messages.length - 1; i++) {
            bot.sendMessage(msg.chat.id, messages[i])
        }
        console.log('sending' + messages[0])
        await editUserStats(msg, songId)
        bot.sendMessage(msg.chat.id, messages[messages.length - 1], options)
    } else if (callback_data.indexOf('Deezer:') > 0) {
        title = msg.text.split('\n')[0]
        artist = msg.text.split('\n')[1]
        id = callback_data.split(":")[1]
        await bot.sendChatAction(msg.chat.id, 'upload_audio')
        path = await deezer.downloadTrackById(id, title, msg.chat.id)
        
        path_fields = path.split(msg.chat.id)
        console.log(path_fields)
        file = path_fields[1]
        title = file.substr(1).substr(0, this.length - 5)
        console.log("[X] title:  ",title)
        queryOptions = {
            caption: 'Downloaded By @lyricBot',
            performer: artist,
            title: title,
        }
        
        const fileOptions = {
            filename: file.substr(1),
            contentType: 'audio/mpeg',
        };
        
        await editUserStats(msg, null, id)
        await bot.sendChatAction(msg.chat.id, 'upload_audio')
        console.log("[X] this is the path: ", path)
        await bot.sendAudio(msg.chat.id, path, queryOptions, fileOptions)
        await utils.sh(`rm -r ${msg.chat.id}`)
    }
}


bot.on('message', async msg => {

    chatId = msg.chat.id

    
    if (msg.text == '/start') {
        await addUserToDb(msg)
        btn1 = keyboards.makeInlineQueryButton('Try Inline Search', '')
        btn2 = keyboards.makeInlineQueryButton('Download a Song', '-Song:')
        buttons = keyboards.verticalKeyboard([btn1, btn2])
        keyboard = keyboards.makeInlineKeyboard(buttons)
        options = keyboards.makeReplyKeyboard(keyboard)
        bot.sendMessage(msg.chat.id, DESCRIPTION, options)
        return
    }

    if (message.isInline(msg)) {
        console.log('handling in chat')
        inChatRequests[msg.chat.id] = true
        await bot.deleteMessage(chatId, msg.message_id)
        handleInChatRequest(msg)
        return
    }

    if (await message.isBroadcast(msg)) {
        if (msg.text) {
            broadcastText(msg)
        } else if (msg.photo) {
            broadcastPhoto(msg)
        }

    } else {
        console.log(msg.text)
        if (msg.text && genius.isLink(msg.text)) {
            lyrics = await genius.scrape(msg.text)
            keyboard = keyboards.lyrics('', '')
            messages = utils.chunkSubstr(lyrics, MAX_MESSAGE_SIZE)
        } else if( msg.text && !genius.isLink(msg.text)){
            popularHit = await genius.getPopularHit(msg.text) || {}
            lyrics = await genius.scrape(popularHit.url)
            messages = utils.chunkSubstr(`Lyrics of ${popularHit.full_title} \n\n${lyrics}`, MAX_MESSAGE_SIZE)
            keyboard = keyboards.lyrics(popularHit.title, msg.text)
        }
        else{
            bot.sendMessage(chatId, "Please send a genius link or a song title (text only)")
            return
        }
        options = keyboards.makeReplyKeyboard(keyboard)
        for (i = 0; i < messages.length - 1; i++) {
            bot.sendMessage(chatId, messages[i])
        }
        bot.sendMessage(chatId, messages[messages.length - 1], options)
    }
})


bot.on('inline_query', async query => {

    console.log(query)
    request_query = query.query.toLowerCase().trim()

    if (request_query != '' && request_query != '-song:') {
        if (request_query.indexOf('song:') > 0) {
            array = request_query.split('song:')
            search_term = array[1]
            search_result = await deezer.search(search_term)
            query_result = deezer.organizeSearch(search_result)
            bot.answerInlineQuery(query.id, query_result);

        } else {
            hits = await genius.search(request_query)
            query_result = await genius.organizeSearch(hits);
            bot.answerInlineQuery(query.id, query_result);
        }
    }

})

bot.on('chosen_inline_result', async query => {

    await utils.sleep(2000)
    chatId = query.from.id
    if (inChatRequests[chatId]) {
        inChatRequests[chatId] = false
        return
    }
    if (query.query.toLowerCase().indexOf('song:') > 0) {
        use_bot_btn = keyboards.makeURLbutton('Visit Bot', BOT_URL)
        buttons = keyboards.verticalKeyboard([use_bot_btn])
        InlineKeyboardMarkup = keyboards.makeInlineKeyboard(buttons)
        options = {
            inline_message_id: query.inline_message_id,
            reply_markup: InlineKeyboardMarkup
        }
        bot.editMessageText('This feature is only available in the bot', options)
    } else {
        song = await genius.getSongInfoById(query.result_id)
        lyrics = await genius.scrape(song.url)

        use_bot_btn = keyboards.makeURLbutton('Read More', BOT_URL)
        inline_search_text = 'Wanna share another Lyrics? Try inline search'
        inline_search = keyboards.makeInlineQueryButton(inline_search_text, song.title)


        buttons = keyboards.verticalKeyboard([use_bot_btn, inline_search])
        InlineKeyboardMarkup = keyboards.makeInlineKeyboard(buttons)

        options = {
            inline_message_id: query.inline_message_id,
            reply_markup: InlineKeyboardMarkup
        }

        messages = utils.chunkSubstr(`Lyrics of ${song.title} \n\n${lyrics}`, MAX_MESSAGE_SIZE)

        try {
            bot.editMessageText(messages[0], options)
            editUserStats(query, query.result_id)
        } catch {
            console.log('Message sent to chat')
        }
    }

})


async function broadcastPhoto(msg) {
    console.log(msg)
    rawMsg = msg.caption
    array = rawMsg.split('THISISABROADCASTTAG:') //This is a broadcast term
    realCaption = array[1]
    options = {
        caption: realCaption
    }
    fileId = msg.photo[msg.photo.length - 1].file_id
    
    users = await getCollection('users')
    count = 0
    for (var i = 0; i < users.length; i++) {
        chatId = parseInt(users[i].data.chatId)
        try {
            await bot.sendPhoto(chatId, fileId, options)
        } catch (err) {
            continue
        }

        count += 1
        console.log(`sent to user ${chatId}, ${count}/${users.length}`, )
    }
    console.log("Completed Broadcast")
    bot.sendMessage(msg.chat.id, `sent to ${count}/${users.length} users`)
}

async function broadcastText(msg) {
    console.log(msg)
    rawMsg = msg.text
    array = rawMsg.split('THISISABROADCASTTAG:') // this is a broadcast term 
    realMsg = array[1]
    users = await getCollection('users')
    count = 0
    for (var i = 0; i < users.length; i++) {
        chatId = parseInt(users[i].data.chatId)
        try {
            await bot.sendMessage(chatId, realMsg)
        } catch (err) {
            continue
        }

        count += 1
        console.log(`sent to user ${chatId}, ${count}/${users.length}`, )
    }
    console.log("Completed Broadcast")
    bot.sendMessage(msg.chat.id, `sent to ${count}/${users.length} users`)
}

// This lines are here to make the app pingable to keep it from sleeping on a free heroku deployment ;)
app.get('/', function (req, res) {
    res.send('hello, world!')
})


app.listen(Port, () => {
    console.log('Listening on port', Port)
})