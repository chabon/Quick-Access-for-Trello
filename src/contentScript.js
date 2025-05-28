

if (location.href == "https://trello.com/1/token/approve") {

    // get token
    var element = document.getElementsByTagName("pre");
    var token = element[0].innerText.replace(/\s+/g, "");


    // send token to background.js
    chrome.runtime.sendMessage({ name: "authorized", token: token });
}
