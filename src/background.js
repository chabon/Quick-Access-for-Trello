// ------------------------------------------------------------
// File    : background.js
// Brief   : 
// Author  : chabon
// Since   : 2017/12/09(土)
// Lisence : 
// ------------------------------------------------------------

// Trello Extension
var Ext = {
    key : "dda512990435742e063d4371e91b3447",
};


// message from contents scripts
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse){
    if(request.name == "authorized"){
        // if authorized page is guided by this extention, set token
        chrome.tabs.query({active:true, lastFocusedWindow:true}, function(tabs){
            if(tabs[0].id == localStorage.authorizeTabId){
                localStorage.token = request.token;
                chrome.tabs.remove(tabs[0].id, function(){
                    localStorage.authorizeTabId = null;
                });
            }
        });
    }
});


// connect from popup page
chrome.runtime.onConnect.addListener(function(port){
    if(port.name == "popup"){
        // when popup window closed, save view setting
        port.onDisconnect.addListener(function(port){
            var popup = chrome.extension.getViews()
                .find( w => typeof w.Popup != 'undefined');
            popup.AdditionTab.saveView();
        });
    }
});


Ext.openAuthorizeTab = function() {
    var authorizeURL  = "https://trello.com/1/authorize"
        authorizeURL += "?key=" + Ext.key
        authorizeURL += "&name=Quick%20Access%20for%20Trello"
        authorizeURL += "&expiration=never&response_type=token&scope=read,write"
    var prop = {
        url : authorizeURL,
    }
    chrome.tabs.create(prop, function(tab){
        localStorage.authorizeTabId = tab.id;
    });
}



