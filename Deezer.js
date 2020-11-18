const axios = require('axios')
const utils = require('./utils')
const keyboards = require('./keyboards.js')
const fs = require('fs');
const { encode } = require('punycode');


async function deezerInstance() {
    const instance = axios.create({
        baseURL: 'https://api.deezer.com',
        timeout: 10000000,
    });
    return instance;
}


async function search(title) {
    console.log('[X] Searching from deezer')
    const instance = await deezerInstance();
    title = encodeURIComponent(title)
    const response = await instance.get('/search?q=' + title)
    return response.data.data
}


async function downloadFromDeezer(ripUrl, chatId) {
    console.log('Downloading [X]' + ripUrl + 'for chatId' + chatId)
    try {
        await utils.sh(`node SMLoadr.js -u "${ripUrl}" -p ${chatId}`);
    } catch (err) {
        console.log(err)
    } finally {
        path = `./${chatId}`
        return path
    }
}


async function downloadTrackById(id, title, chatId) {
    link = `https://www.deezer.com/track/${id}`
    console.log('[X] downloading ' + link)
    path = await downloadFromDeezer(link, chatId)
    const files = fs.readdirSync(`./${chatId}/`)
    var filename = ""
    files.forEach(file => {
        if (file.endsWith(".mp3")) {
            filename = file
        }
    })
    return `./${chatId}/${filename}`
}


function organizeSearch(hits) {
    let queryReply = [];

    hits.forEach((element, index) => {
        if (element.type != 'track')
            return
        let result = {}
        result.type = 'article';
        result.id = element.id;
        result.title = `${element.title} by ${element.artist.name}`;
        result.input_message_content = {
            message_text: `${element.title}\n${element.artist.name}`
        }
        downloading_btn = keyboards.makeCallbackButton('Getting Song...', `-Deezer:${element.id}`)
        buttons = keyboards.verticalKeyboard([downloading_btn])
        InlineKeyboardMarkup = keyboards.makeInlineKeyboard(buttons)
        result.reply_markup = InlineKeyboardMarkup;

        result.thumb_url = element.album.cover;
        result.url = `t.me/lyricbot/${element.id}`;
        queryReply.push(result);
        console.log('    res number:' + (index + 1) + ': ' + result.title)

    });
    return queryReply
}



module.exports = {
    downloadTrackById,
    search,
    organizeSearch
}