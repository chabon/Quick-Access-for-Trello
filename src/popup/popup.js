
// for release
window.console = {};
window.console.log = function(i){return;};
window.console.time = function(i){return;};
window.console.timeEnd = function(i){return;};

var Popup = {
    tabPageColor : ["#ffffff", "#f4f4ff", "#f4fff4"],
    tabCtrlBorderColor : "#ccc",
};


Popup.init = function(){
    // has not token
    if(!localStorage.token){
        chrome.runtime.getBackgroundPage(function(bg){
            bg.Ext.openAuthorizeTab();
        });
        return;
    }

    // has token
    TrelloApi.token = localStorage.token;

    // has cache?
    BoardTab.cache.boards = Util.getSetting("boards", [], true);

    // init tabctrolItem color
    var tabcontrolItems = $(".tabcontrolItem");
    for(let i in Popup.tabPageColor){
        tabcontrolItems.eq(i).css( 'background-color', Popup.tabPageColor[i] );
        tabcontrolItems.eq(i).css( 'border-color', Popup.tabCtrlBorderColor );
    }
    $('#tabcontrolLine').css( 'border-color', Popup.tabCtrlBorderColor );

    // tabcontrol event
    $(".tabcontrolItem").click(function(){
        let nextIndex = $(".tabcontrolItem").index(this);
        Popup.changeTabPage(nextIndex);
        localStorage.lastTabIndex = nextIndex;
    });

    // keypress event
    $(document).keypress(function(e){
        switch( Popup.getCurrentTabIndex() ){
            case 0: BoardTab.onKeypressed(e); break;
            case 1: AdditionTab.onKeypressed(e); break;
        }
    });

    // 
    BoardTab.boardListInitialized = false;

    // tab page select
    var index = Util.getSetting("lastTabIndex", 0);
    Popup.changeTabPage(index);

}


Popup.getCurrentTabIndex = function(){
    return $(".tabcontrolItem").index( $(".tabcontrolItem.selected") );
}

Popup.getCurrentTabName = function(){
    switch( Popup.getCurrentTabIndex() ){
        case 0: return "board";
        case 1: return "add" ;
        case 2: return "page";
        default: return "unknown";
    }
}


Popup.changeTabPage = function(nextIdx){
    // save current tab page setting
    if(Popup.getCurrentTabIndex() == 1) AdditionTab.saveView();
    
    // 
    var hideIdx = [0,1,2].filter( i=> i != nextIdx);

    // tabcontrol item(header)
    var tabcontrolItems = $(".tabcontrolItem");
    tabcontrolItems.eq(nextIdx).addClass("selected");
    tabcontrolItems.eq(hideIdx[0]).removeClass("selected");
    tabcontrolItems.eq(hideIdx[1]).removeClass("selected");

    // tab page
    var tabpages = $(".tabpage");
    tabpages.eq(nextIdx).addClass("selected");
    tabpages.eq(hideIdx[0]).removeClass("selected");
    tabpages.eq(hideIdx[1]).removeClass("selected");

    // tabcontrol item border color
    tabcontrolItems.eq(nextIdx).css( 'border-bottom-color', Popup.tabPageColor[nextIdx] );
    tabcontrolItems.eq(hideIdx[0]).css( 'border-color', Popup.tabCtrlBorderColor );
    tabcontrolItems.eq(hideIdx[1]).css( 'border-color', Popup.tabCtrlBorderColor );

    // tab page color
    $("#tabbody").css( 'background-color', Popup.tabPageColor[nextIdx] );

    // init page contents
    if(nextIdx == 0){
        if( !BoardTab.boardListInitialized ) BoardTab.init();
    }
    else if(nextIdx == 1){
        AdditionTab.init();
    }
    else if(nextIdx == 2){

    }
}



// debug
$('#debug').click(function(e) {
    chrome.runtime.getBackgroundPage(function(bg){
        TrelloApi.getBoardInfo().then(function(data){
        });
    });
});



// entry point
Popup.init();
chrome.runtime.connect({name: "popup"});

