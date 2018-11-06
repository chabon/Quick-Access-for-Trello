
var TrelloApi = {
    token : null,
    key : "dda512990435742e063d4371e91b3447",
}


TrelloApi.getBoardInfo = function(){
    return new Promise(function(resolve, reject){
        var url  = "https://api.trello.com/1/batch/";
            url += "?urls=/members/me/boards?lists=open";
            url += ",/members/me/boardStars";
            url += "&key=" + TrelloApi.key;
            url += "&token=" + TrelloApi.token;
        $.ajax({
            url: url,
            dataType: "json"
        }).done(function(data){

            // get boards and exclude closed boards
            var resultData = data[0][200].filter( b => !b.closed );
            
            // add pos attribute
            for(let i in resultData){ resultData[i].pos = 0; } 

            // get starred board pos info
            var boardStar = data[1][200];
            for(let i in boardStar){
                let b = resultData.find( b => b.id == boardStar[i].idBoard );
                if(b) b.pos = boardStar[i].pos;
            }

            resolve(resultData); // success
        }).fail(function(data){
            reject(data);  // failed
        });
    });
}


TrelloApi.getCardInfo = function(boardId){
    return new Promise(function(resolve, reject){
        var url  = "https://api.trello.com/1/boards/" + boardId + "/cards/open?";
            url += "&key=" + TrelloApi.key;
            url += "&token=" + TrelloApi.token;
        $.ajax({
            url: url,
            dataType: "json"
        }).done(function(data){
            resolve(data); // success
        }).fail(function(data){
            reject(data);  // failed
        });
    });
}



TrelloApi.getLabelInfo = function(boardId){
    return new Promise(function(resolve, reject){
        var url  = "https://api.trello.com/1/boards/" + boardId + "/labels?";
            url += "&key=" + TrelloApi.key;
            url += "&token=" + TrelloApi.token;
        $.ajax({
            url: url,
            dataType: "json"
        }).done(function(data){
            resolve(data); // success
        }).fail(function(data){
            reject(data);  // failed
        });
    });
}


TrelloApi.addCard = function(cardData){
    return new Promise(function(resolve, reject){
        var url  = "https://api.trello.com/1/cards?";
            url += "&key=" + TrelloApi.key;
            url += "&token=" + TrelloApi.token;
            url += "&idList=" + cardData.idList;
            url += "&name=" + encodeURIComponent( cardData.title );
            url += "&desc=" + encodeURIComponent( cardData.desc );
            url += "&idLabels=" + cardData.idLabels;
            url += "&pos=" + cardData.pos;
        $.ajax({
            url: url,
            type: 'POST',
            dataType: "json"
        }).done(function(data){
            resolve(data); // success
        }).fail(function(data){
            reject(data);  // failed
        });
    });
}
