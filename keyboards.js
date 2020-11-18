function verticalKeyboard(buttons){
    markup = []
    buttons.forEach( button => {
        markup.push([button])
    })
    return markup
}


function makeInlineKeyboard(buttons){
    return {
        inline_keyboard: buttons
    }
}


function lyrics(songTitle = '', query = '') {
    inline_search_text = 'Didn\'t get the right Lyrics? Try inline search'
    inline_search = makeInlineQueryButton(inline_search_text, query)
    get_song = makeInlineQueryButton('Download Song', `-Song:${songTitle}`)
    buttons = verticalKeyboard([inline_search, get_song])
    InlineKeyboardMarkup = makeInlineKeyboard(buttons)
    return InlineKeyboardMarkup
}


function makeInlineQueryButton(text, switch_inline_query_current_chat){
    return {
        text,
        switch_inline_query_current_chat
    }
}


function makeCallbackButton(text, callback_data){
    return {
        text,
        callback_data
    }
}


function makeURLbutton(text, url){
    return {
        text, 
        url
    }
}


function makeReplyKeyboard(reply_markup){
    return {
        reply_markup
    }
}


module.exports = {
    lyrics,
    makeCallbackButton,
    verticalKeyboard,
    makeInlineKeyboard,
    makeURLbutton,
    makeInlineQueryButton,
    makeReplyKeyboard
}