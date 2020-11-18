const cheerio = require('cheerio')
const axios = require('axios')
const keyboards = require('./keyboards')
const GENIUS_URL = 'https://genius.com'
const GENIUS_FLAG = '-Genius:'
const utils = require("./utils")

async function geniusInstance() {
    const secretKey = 'A-M3uzyKxsuluUPKOA_JF-MOxDK4ZXTUPpo3oL2lkDDrT4gfDW0RpK_KbyHfO6U3';
    const instance = axios.create({
        baseURL: 'https://api.genius.com',
        timeout: 10000000,
        headers: {
            'Authorization': 'Bearer ' + secretKey
        }
    });
    return instance;
}


function isLink(url) {
    console.log(url)
    if (url && url.toLowerCase().indexOf('genius.com') > -1)
        return true
    return false
}


async function getSongInfoById(id) {
    console.log('[X] Fetching song by id')
    const instance = await geniusInstance();
    const response = await instance.get('/songs/' + id)
    songInfo = response.data.response.song
    songInfo.url = GENIUS_URL + songInfo.path
    return songInfo
}


async function search(query) {
    console.log('[X] Searching')
    const instance = await geniusInstance();
    query = encodeURIComponent(query)
    const response = await instance.get('/search?q=' + query)
    return response.data.response.hits
}


async function getPopularHit(song) {
    console.log('[X] searching popular')
    hits = await search(song)
    result = undefined
    if (hits[0]) {
        result = hits[0].result
        result.url = GENIUS_URL + result.path
    } 
    return result
}


async function organizeSearch(query) {
    console.log('[X] to be processed: ' + query.query)
    let queryReply = [];

    hits.forEach((element, index) => {
        if (element.type != 'song')
            return
        let result = {}
        result.type = 'article';
        result.id = element.result.id;
        result.title = element.result.full_title;
        result.input_message_content = {
            message_text: element.result.full_title
        }
        result.thumb_url = element.result.song_art_image_thumbnail_url;
        result.url = element.result.url;

        loading_btn = keyboards.makeCallbackButton('Loading...', GENIUS_FLAG + element.result.id)
        buttons = keyboards.verticalKeyboard([loading_btn])
        InlineKeyboardMarkup = keyboards.makeInlineKeyboard(buttons)
        result.reply_markup = InlineKeyboardMarkup;

        queryReply.push(result);
        result.songInfo = element.result
        console.log('    res number:' + (index + 1) + ': ' + result.title)

    });
    return queryReply

}


async function scrape(url) {
    errMessage = "Sorry couldnt fetch lyrics. Make sure you sent a valid song title or Genius link"

    console.log('[X] Scraping', url)
    try{
        res = await axios.get(url)
    }
    catch{
        return errMessage
    }

    if (res.status == 200) {
        const html = res.data
        const $ = cheerio.load(html);
        const statsTable = $('.lyrics > p');
        lyrics = statsTable.text();
        console.log(lyrics)
        return lyrics
    } else {
        return errMessage
    }
}




module.exports = {
    scrape,
    search,
    isLink,
    getSongInfoById,
    getPopularHit,
    organizeSearch
}