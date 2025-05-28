// ------------------------------------------------------------
// File    : background.js
// Brief   : 
// Author  : chabon
// Since   : 2017/12/09(土)
// Lisence : 
// ------------------------------------------------------------

// Trello Extension
const Ext = {
    key : "dda512990435742e063d4371e91b3447",
};


// message from contents scripts
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse){
    if(request.name == "authorize"){
        Ext.openAuthorizeTab();
        return;
    }
    else if(request.name == "authorized"){
        // if authorized page is guided by this extention, set token
        chrome.tabs.query({active:true, lastFocusedWindow:true}, async function(tabs){
            const result = await chrome.storage.local.get("authorizeTabId");
            const tabId = result["authorizeTabId"];
            if(tabs[0].id == tabId){
                await chrome.storage.local.set({ "token": request.token });
                await chrome.storage.local.remove("authorizeTabId");
                // await chrome.tabs.remove(tabs[0].id);
            }
            sendResponse();
        });
        return true;
    }
    else if(request.name == "debug"){
        console.log("[debug] value = ", request.value);
    }
});


Ext.openAuthorizeTab = async function() {
    let authorizeURL  = "https://trello.com/1/authorize"
        authorizeURL += "?key=" + Ext.key
        authorizeURL += "&name=Quick%20Access%20for%20Trello"
        authorizeURL += "&expiration=never&response_type=token&scope=read,write"
    const prop = {
        url : authorizeURL,
    }
    const tab = await chrome.tabs.create(prop);
    await chrome.storage.local.set({ "authorizeTabId": tab.id });
}



