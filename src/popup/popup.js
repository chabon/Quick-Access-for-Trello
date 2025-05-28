
var Popup = {
    tabPageColor : ["#ffffff", "#f4f4ff", "#f4fff4"],
    tabCtrlBorderColor : "#ccc",
};


Popup.init = async function(){
    // has not token
    const token = (await chrome.storage.local.get("token"))["token"];
    if(!token){
        chrome.runtime.sendMessage({ name:"authorize" });
        return;
    }

    // has token
    TrelloApi.token = token;

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
        localStorage.setItem("lastTabIndex", nextIndex);
    });

    // keypress event
    $(document).keypress(function(e){
        switch( Popup.getCurrentTabIndex() ){
            case 0: BoardTab.onKeypressed(e); break;
            case 1: AdditionTab.onKeypressed(e); break;
        }
    });

    // on popup page closing, save UI
    document.addEventListener('visibilitychange', function(){
        AdditionTab.saveView();
    }, false);

    // logout link click event
    $('#logout-link').on('click',async function(e) {
        e.preventDefault(); // prevent reload
        if (confirm("Are you sure you want to log out?")) {
            await Popup.logout();
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


Popup.logout = async function(){
    // remove token
    await chrome.storage.local.remove("token");
    // remove cache
    localStorage.removeItem("boards");
    localStorage.removeItem("lastTabIndex");
    localStorage.removeItem("add-prevCardTitle");
    localStorage.removeItem("add-prevDescription");
    localStorage.removeItem("add-prevBoardId");
    localStorage.removeItem("add-prevListId");
    localStorage.removeItem("add-prevPosition");
    localStorage.removeItem("add-prevLabelBoxInnerHtml");
    // close popup page
    window.close();
}

// debug
$('#debug').click(function(e) {

});



// entry point
Popup.init();
