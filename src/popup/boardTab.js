
var BoardTab = {
    cache: {
        boards : [],
    },
    boards: [],
    boardListInitialized: false,
};


BoardTab.tooltipItemPrefix = [
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
]


BoardTab.init = function(){
    // has cache of boards info
    var cache = BoardTab.cache.boards;
    if(cache.length > 0){
        // starred boards
        let sBoards = cache.filter( b => b.starred );
        sBoards.sort( (a, b) => { return a.pos - b.pos; } );
        updateBoardList("starredBoardList", sBoards);

        // personal boards
        updateBoardList("personalBoardList", cache);
    }

    // get board info by trello api
    TrelloApi.getBoardInfo().then(function(data){
        // result
        BoardTab.boards = data;

        // update starred board
        let bd = BoardTab.boards.filter( b => b.starred );
        bd.sort( (a, b) => { return a.pos - b.pos; });
        updateBoardList("starredBoardList", bd);

        // update personal board
        updateBoardList("personalBoardList", BoardTab.boards);

        // get cards data in starred board (if there is no board update, get from cahce)
        bd = BoardTab.boards;
        var promises = [];
        for(let i in bd){
            if(bd[i].starred){
                let bc = cache.find( b => b.id == bd[i].id); // board of cahce
                if( bc && bc.starred && bd[i].dateLastActivity == bc.dateLastActivity ){
                    bd[i].lists = bc.lists;
                }
                else{
                    promises.push( BoardTab.grantCardInfoToBoard(bd[i].id) );
                }
            }
        }
        Promise.all(promises).then(function(results){
            // add graphs to items
            addGraphsToBoardList("starredBoardList", BoardTab.boards);

            // add boards tooltip
            updateBoardsTooltip("starredBoardList", BoardTab.boards);
            updateBoardsTooltip("personalBoardList", BoardTab.boards);

            // save
            localStorage.boards = JSON.stringify( BoardTab.boards );

            // initialized
            BoardTab.boardListInitialized = true;
        });
    });
}


BoardTab.grantCardInfoToBoard = function(boardId){
    return new Promise(function(resolve, reject){
        TrelloApi.getCardInfo(boardId).then(function(data){
            // init cards data in lists
            var bd = BoardTab.boards.find( b => b.id == boardId );
            if(!bd) reject(data);
            for(let i in bd.lists){
                bd.lists[i].cards = [];
            }

            // distribute the acquired cards to the lists
            for(let i in data){
                var d = {
                    id        : data[i].id,
                    name      : data[i].name,
                    desc      : data[i].desc,
                    pos       : data[i].pos,
                    shortLink : data[i].shortLink,
                    comments  : data[i].badges.comments,
                    due       : data[i].badges.due,
                    dueComp   : data[i].badges.dueComplete,
                };
                bd.lists.find( l => l.id == data[i].idList)
                    .cards.push(d);
            }
            resolve(data);
        }, function(){
            reject(data);
        });
    });
}


var updateBoardList = function(boardListId, boardsInfo){
    $("#" + boardListId).empty();
    for(let i in boardsInfo){
        $("#" + boardListId).append( createNewBoardItem(boardsInfo[i]) );
    }
}


var updateBoardsTooltip = function(boardListId, boardsInfo){
    var items = $("#" + boardListId).children();
    var lineMax = 20;
    items.each(function(i, elem){
        var bd = boardsInfo.find( b => b.id == $(elem).attr("id") );
        var link = $(elem).find('.boardItemLink');
        var title = bd.name;
        for(let i in bd.lists){
            if(i == lineMax) {
                title += '\n ...';
                break;
            }
            title += '\n ';
            title += bd.lists[i].name;
            if(bd.lists[i].cards){
                title += ' (' + bd.lists[i].cards.length + ')';
            }
        }
        link.attr("title", title);
    });
}


var createNewBoardItem = function(board){
    var attr = {
        "class"     : "boardItem",
        id          : board.id,
        style       : "background-color:" + board.prefs.backgroundColor,
        "data-pos"  : board.pos,
        "data-name" : board.name,
    };
    var newItem = $('<div>', attr);
    
    attr = {
        "class" : "boardItemLink",
        target  : "_blank",
        href    : board.shortUrl,
    };
    newItem.append( $('<a>', attr) );
    
    newItem.find('.boardItemLink').append( $('<div>', { "class" : "boardItemFade"}) );
    
    attr = {
        "class" : "boardItemHeader",
        style   : "background-color:" + board.prefs.backgroundColor, 
    };
    newItem.find('.boardItemFade').append( $('<div>', attr) );

    newItem.find('.boardItemFade').append( $('<div>', { "class" : "boardItemBody", }) );
    newItem.find('.boardItemBody').html(board.name);

    return newItem;
}


var addGraphsToBoardList = function(boardListId, boardInfo){
    var opt = {
        listMax : 5,
        marginRightEnd : 3,
        graph_width : 15,
        graph_margin : 1,
        graph_cardMax : 10,
        tooltip_lineMax : 30,
        tooltip_wordCntMax : 100,
    };
    var items = $('#' + boardListId).children();
    items.each(function(i, elem){
        // prepare
        var lists = [];
        var bd = boardInfo.find( b => b.id == $(elem).attr("id") );
        if(bd){ 
            lists = bd.lists; 
            lists = lists.slice(0, opt.listMax);
        }
        var wrapper = $(elem).find(".boardItemFade");

        // create graph container
        var graphContainer = $('<div>', {
            "class" : "boardItemGraphContainer",
            width   : opt.marginRightEnd + lists.length * (opt.graph_width + opt.graph_margin) + 2,
            title   : "",
        });
        wrapper.append(graphContainer);
        
        // create graph
        for(let i=lists.length-1; i>=0; i--){
            // parameters
            let j = lists.length - 1 - i; // 0 to opt.listMax
            let right = opt.marginRightEnd + j * ( opt.graph_width + opt.graph_margin );
            let height = 36 * ( lists[i].cards.length / opt.graph_cardMax );
            if(height < 0) height = 0;
            else if(height > 36) height = 36;
            height = Math.round(height);

            // append graph
            let style  = 'width:' + opt.graph_width + 'px;';
                style += 'right:' + right + 'px;';
                style += 'background-color:' + bd.prefs.backgroundColor + ';';
            let container = $(elem).find(".boardItemGraphContainer");
            let graph = $('<div>', {
                "class" : "boardItemGraph",
                style   : style,
            });
            container.append(graph);
            graph.css('height'); // for css animation
            graph.css('height', height + 'px');

            // append graph frame
            let stylef  = 'width:' + opt.graph_width + 'px;'
                stylef += 'right:' + right + 'px;'
            let graphFrame = $('<div>', {
                "class" : "boardItemGraphFrame",
                style   : stylef,
                "data-boardId" : bd.id,
                "data-listId" : lists[i].id,
            });
            graphFrame.click(function(e){
                // switch to addition tab
                e.which = 13; // enter key
                BoardTab.onKeypressed(e);
            });
            container.append(graphFrame);

            // tooltip
            var message  = lists[i].name + ' (' + lists[i].cards.length + ') ';
            for(let k=0; k < lists[i].cards.length; k++){
                let card = lists[i].cards[k];
                if( k == opt.tooltip_lineMax ){
                    message += '\n ...';
                    break;   
                }
                let pre = BoardTab.tooltipItemPrefix[k];
                if(!pre) pre = '-';
                pre = '[' + pre + '] ';
                let m = card.name.replace(/\r?\n/g," ");;
                message += '\n'+ pre + Util.substr(m, opt.tooltip_wordCntMax, '...');
                if(card.desc) message += ' +';
                if(card.comments) message += ' @' + card.comments; 
                // if(card.due) message += ' [12/30 ✓]';
            }
            // message +=  '\n[space] Add new card to "' + lists[i].name + '"';
            graphFrame.attr("title", message);
        }

        // create separator
        let style  = "right:" + graphContainer.width() + 'px; ';
            style += 'background-color:' + bd.prefs.backgroundColor + ';';
        var sep = $('<div>', {
            "class" : "boardItemGraphSeparater",
            style   : style,
        });
        wrapper.append(sep);
    
    });
}


BoardTab.onKeypressed = function(e){
    // 0-9, a-z, A-Z, Enter key pressed on graphFrame
    let graphFrame = $(':hover').filter( (i, el) => $(el).attr('class') == 'boardItemGraphFrame' );
    if(graphFrame.length > 0){
        // id
        let boardId = graphFrame.attr('data-boardId');
        let listId = graphFrame.attr('data-listId');

        // keycode
        let keycode = e.which;

        // get cards info
        let bd, list, cards;
        bd = BoardTab.boards.find( b => b.id == boardId );
        if(bd){
            list = bd.lists.find( l => l.id == listId );   
            if(list) cards = list.cards; 
        }

        // on pressed enter key
        if(keycode == 13){
            e.preventDefault();
            // switch to addition tab
            let prevBoardId = Util.getSetting('add-prevBoardId', '');
            let prevListId = Util.getSetting('add-prevListId', '');
            localStorage.setItem('add-prevBoardId', boardId);
            localStorage.setItem('add-prevListId', listId);
            if(prevBoardId != boardId){
                localStorage.setItem('add-prevLabelBoxInnerHtml', "");
            }
            Popup.changeTabPage(1);
            return;
        }

        // get card info
        let card;
        if(cards){
            // card index
            let ch = String.fromCharCode(keycode)
            let cardIndex = BoardTab.tooltipItemPrefix.indexOf(ch);
            if(cardIndex < 0) return;
            card = cards[cardIndex];
        }

        // go to card url
        if(card){
            var prop = {
                url : 'https://trello.com/c/' + card.shortLink,
            }
            chrome.tabs.create(prop, function(tab){});
        }
        // end of if
    }
    // end of func
}



