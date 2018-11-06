
var AdditionTab = {
    boards : null,
};

AdditionTab.labelColor = {
    green  : { value : "#65C04F", order : 1},
    yellow : { value : "#E9DB13", order : 2},
    orange : { value : "#F5AE4F", order : 3},
    red    : { value : "#E05D4B", order : 4},
    purple : { value : "#C26CDF", order : 5},
    blue   : { value : "#3D72BD", order : 6},
    sky    : { value : "#4CBEDE", order : 7},
    lime   : { value : "#62EB95", order : 8},
    pink   : { value : "#F979CE", order : 9},
    black  : { value : "#4E4E4E", order : 10},
    null   : { value : "#B5B9BE", order : 99},
};


AdditionTab.init = function(){
    // close view option
    AdditionTab.toggleViewOptionShowing(true);

    // prev view option checkbox
    $('#viewOptions').children('input').each(function(i, elem){
        let tgtKey = elem.getAttribute('data-target'); 
        let lsKey = "setting-add-viewoption-" + tgtKey;
        var value = Util.getSetting(lsKey, true, true);
        $(elem).prop("checked", value);
    });
    AdditionTab.updateView();

    // prev textArea height
    let lsKey = "add-cardTitleAreaHeight";
    $('#textarea-cardTitle').css('height', Util.getSetting(lsKey, "auto") );
    lsKey = "add-descriptionAreaHeight";
    $('#textarea-description').css('height', Util.getSetting(lsKey, "auto") );
    
    // prev textArea value
    $('#textarea-cardTitle').val( Util.getSetting("add-prevCardTitle", "") );
    $('#textarea-description').val( Util.getSetting("add-prevDescription", "") );
    
    // prev position
    let pos = Util.getSetting("add-prevPosition", "top"); 
    $('#selectbox-position').val(pos);

    // prev labelbox items
    $('#selectbox-label').empty();
    $('#selectbox-label').append( $('<option>').text("Select Labels...").val("caption") );
    let lbHtml = Util.getSetting("add-prevLabelBoxInnerHtml", "", true);
    $('#labelbox').html(lbHtml);
    $('#labelbox > span').on( 'click', e => $(e.target).remove() );

    // focus to card title textarea
    $('#textarea-cardTitle').focus();
    
    // init posting status
    $('#addButton-status').html("");

    // get board info
    AdditionTab.getBoardInfo().then(function(){
        // init selectbox-board
        $('#selectbox-board').empty();
        let bd = AdditionTab.boards.sort( (a, b) => { 
            if(a.starred && b.starred) return a.pos - b.pos;
            else if(a.starred) return -1;
            else if(b.starred) return 1;
            else return 0;
        });
        for(let i in bd){
            $('#selectbox-board').append( $('<option>').text(bd[i].name).val(bd[i].id) );
        }

        // prev board
        let prevId = Util.getSetting("add-prevBoardId", "NoId"); 
        if( bd.some(b=>b.id == prevId) ) $('#selectbox-board').val(prevId);
        else { $('#selectbox-label').empty(); }

        // init selectbox-list, position, label, file
        AdditionTab.updateSelectboxesItem();

        // prev list
        prevListId = Util.getSetting("add-prevListId", "NoId");
        var prevOpt = $('#selectbox-list > option[value="' + prevListId + '"]');
        if( prevOpt.length > 0 ) $('#selectbox-list').val(prevListId);
    });
}


AdditionTab.getBoardInfo = function(){
    return new Promise(function(resolve, reject){
        // already has board info
        if(AdditionTab.boards != null) resolve();

        if(BoardTab.boards.length > 0){
            AdditionTab.boards = BoardTab.boards;
            resolve();
        }
        else{
            TrelloApi.getBoardInfo().then(function(data){
                AdditionTab.boards = data;
                resolve(data);
            });
        }
    });
}


AdditionTab.updateSelectboxesItem = function(){
    // prepare
    if(AdditionTab.boards == null) return;
    var currBdId = $('#selectbox-board').val();
    var currBoard = AdditionTab.boards.find( b=> b.id == currBdId );
    if(!currBoard) return;

    // list
    $('#selectbox-list').empty();
    var lists = currBoard.lists;
    for(let i in lists){
        $('#selectbox-list').append( $('<option>').text(lists[i].name).val(lists[i].id) );
    }

    // label
    TrelloApi.getLabelInfo(currBoard.id).then(function(data){
    $('#selectbox-label').empty();
        $('#selectbox-label').empty();
        $('#selectbox-label').append( $('<option>').text("Select Labels...").val("caption") );
        // sort
        data.sort(function(a, b){
            // color order
            a1 = AdditionTab.labelColor[a.color];
            b1 = AdditionTab.labelColor[b.color];
            if(!a1 || !b1) return 0;
            a1 = a1.order;
            b1 = b1.order;
            if(a1 != b1) return a1 - b1;

            // label name
            return (a.name > b.name)? 1 : -1;
        });

        // add shortcut key info
        for(let i in data){ data[i].shortcutKey = "none"; }
        for(key in AdditionTab.labelColor){
            let lb = data.find( d => d.color == key);
            if(lb) {
                lb.shortcutKey = AdditionTab.labelColor[key].order;
                if(lb.shortcutKey == 10) lb.shortcutKey = 0;
                else if(lb.shortcutKey > 10) lb.shortcutKey = "none";
            }
        }

        // to selectbox
        for(let i in data){
            let name = data[i].name;
            // if(data[i].shortcutKey != "none") name += ' (' + data[i].shortcutKey + ')';
            if(data[i].shortcutKey != "none") name = data[i].shortcutKey.toString() + '. ' + name;
            let elem = $('<option>').text(name).val(data[i].id)
                .attr('data-shortcutKey', data[i].shortcutKey)
                .attr('data-name', data[i].name)
                .attr('data-color', data[i].color)
                .css({
                    "background-color" : AdditionTab.labelColor[data[i].color].value,
                    // "color" : "#fff",
                });
            $('#selectbox-label').append(elem);
        }
    });
}

AdditionTab.addToLabelBox = function(labelId){
    // if lavel view is hidden
    if( $('#row-label').css('display') == 'none' ) return;
    
    // select "select labels..."
    if(labelId == "caption") return;

    // if already exsits label, remove it
    let currLabel = $('#labelbox').find( '[data-id="' + labelId + '"]' );
    if(currLabel.length > 0){
        currLabel.remove();
        $('#selectbox-label').val("caption");
        return;
    }

    // selected item in selectbox
    let selected = $('#selectbox-label').find( '[value="' + labelId + '"]' );

    // add label object
    let name = selected.attr('data-name');
    if(name == "") name = "&nbsp;";
    let label = $('<span>')
        .html(name)
        .attr( 'data-id', selected.val() )
        .attr( 'title', "Click to remove" )
        .css({
            "background-color" : selected.css('background-color'),
        });
    label.on( 'click', e => $(e.target).remove() );
    $('#labelbox').append(label);

    // revert setection
    $('#selectbox-label').val("caption");
}

AdditionTab.updateView = function(){
    $('#viewOptions').children('input').each(function(i, elem){
        let target = elem.getAttribute('data-target'); 
        $('#row-' + target).css( 'display', $(elem).prop("checked")?'block':'none' );
    });
}


AdditionTab.toggleViewOptionShowing = function(bCloseOnly){
    let vo = $('#viewOptions');
    if(vo.css('display') == 'none' && !bCloseOnly){
        vo.css('display', 'block');
        $('#button-viewOption').attr('src', '../images/chevron_up_round.png');
    }
    else{
        vo.css('display', 'none');
        $('#button-viewOption').attr('src', '../images/chevron_down_round.png');
    }
}

AdditionTab.addCardToTrello = function(){
    $('#addButton-status').html("Posting...");
    // data
    let idLabels = "";
    $('#labelbox > span').each( function(i, elem){
        if(idLabels != "") idLabels += ",";
        idLabels += $(elem).data("id");
    });
    var cardData = {
        title    : $('#textarea-cardTitle').val(),
        desc     : $('#textarea-description').val(),
        idList   : $('#selectbox-list').val(),
        pos      : $('#selectbox-position').val(),
        idLabels : idLabels,
    };

    // post
    TrelloApi.addCard(cardData).then(function(data){
        // on successed
        $('#textarea-cardTitle').val("");
        $('#textarea-description').val("");
        // $('#labelbox').empty();

        // message
        var attr = {
            title   : data.name,
            target  : "_blank",
            href    : data.shortUrl,
        };
        let link = $('<a>').attr(attr).text('Done!');
        $('#addButton-status').html(link);

        BoardTab.boardListInitialized = false;
    }, function(){
        // on failed
        $('#addButton-status').html("Failed to add");
    });
}


AdditionTab.saveView = function(){
    // current tab name
    if(Popup.getCurrentTabIndex() != 1) return;

    // view option
    $('#viewOptions').children('input').each(function(i, elem){
        let tgtKey = elem.getAttribute('data-target'); 
        let lsKey = "setting-add-viewoption-" + tgtKey;
        localStorage.setItem(lsKey, $(this).prop("checked"));
    });

    // textArea height
    let lsKey = "add-cardTitleAreaHeight";
    localStorage.setItem( lsKey, $('#textarea-cardTitle').css('height') );
    lsKey = "add-descriptionAreaHeight";
    localStorage.setItem( lsKey, $('#textarea-description').css('height') );

    // textArea value
    localStorage.setItem( "add-prevCardTitle", $('#textarea-cardTitle').val() );
    localStorage.setItem( "add-prevDescription", $('#textarea-description').val() );
    
    // board id
    localStorage.setItem( "add-prevBoardId", $('#selectbox-board').val() );
    
    // list id
    localStorage.setItem( "add-prevListId", $('#selectbox-list').val() );

    // position
    let pos = $('#selectbox-position').val();
    localStorage.setItem( "add-prevPosition", pos );

    // label box items
    let labelBoxContentsHtml = $('#labelbox').html();
    localStorage.setItem( "add-prevLabelBoxInnerHtml" , JSON.stringify(labelBoxContentsHtml) );
}

AdditionTab.onKeypressed = function(e){

    // add card to trello (ctrl + enter)
    if ((e.keyCode == 10 || e.keyCode == 13) && e.ctrlKey){
        AdditionTab.addCardToTrello();
    }
    // add card to trello (shift + enter)
    // if(e.shiftKey && e.keyCode == 13){
        // AdditionTab.addCardToTrello();
    // }

    // if focus on textarea
    if( $(':focus').prop("tagName") == "TEXTAREA" ) return;
        
    // if focus on select (exclude "selectbox-label")
    if( $(':focus').prop("tagName") == "SELECT" ){
        if( $(':focus').prop("id") != "selectbox-label") return;
    }

    // label addition shortcut(0-9)
    if(48 <= e.which && e.which <= 57){
        let num = e.which - 48;
        let labelId = $('#selectbox-label').find( '[data-shortcutKey="' + num + '"]' ).val();
        if(labelId) AdditionTab.addToLabelBox(labelId);
        return;
    }
}


// ---------------------------------------------------- //
// entry point

// init events
$(function(){
    // enter current page info button 
    $('#button-enterCurrPage').on('click', function(){
        chrome.tabs.getSelected(window.id, function (tab) {
            $('#textarea-cardTitle').val(tab.title);
            $('#textarea-description').val(tab.url);
        });
    });
    
    // view option button
    $('#button-viewOption').on('click', function(){
        AdditionTab.toggleViewOptionShowing(false);
    });

    // view option checkbox event
    $('#viewOptions').children('input').on('click', function(){
        AdditionTab.updateView();
    });

    // selectbox-board event
    $('#selectbox-board').change(function(){
        $('#labelbox').empty();
        AdditionTab.updateSelectboxesItem();
    });

    // selectbox-label event
    $('#selectbox-label').change(function(){
        let labelId = $(this).children('option:selected').val();
        AdditionTab.addToLabelBox(labelId);
    });

    // shortcut key
    $('#selectbox-label').keypress(function(e){
        // 0-9 key is Reserved
        if(48 <= e.which && e.which <= 57){ 
            // cancel event on this element, and propagate to parent
            e.preventDefault();
        }
    });

    // add button
    $('#addButton').on('click', function(){
        AdditionTab.addCardToTrello();
    });
});

