// ==UserScript==
// @name         Storyblocks Batch Downloader
// @namespace    hhttp://www.storyblocks.com/
// @version      0.1
// @description  Batch download all currently searched clips from Storyblocks (Audio)
// @author       Matesaktesak (derived from onivestaf)
// @match        https://www.storyblocks.com/audio/search*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=storyblocks.com
// @require      https://code.jquery.com/jquery-3.5.1.min.js
// @require      https://raw.githubusercontent.com/eligrey/FileSaver.js/master/dist/FileSaver.min.js
// @grant        GM_download
// @run-at       document-idle
// ==/UserScript==


'use strict'

var pageCounter = 0; // Global page counter
var checkloopID = 0; // ID of the set timer interval, so we can stop it later

(async ()=>{ // ENTERY POINT (probably does't need to be async..)
    setTimeout(()=>{ // Let the initial page load (this isn't needed, but it makes the script more usable)
        if(confirm("Starting BATCH downloader?") !== true) return; // If the user doesn't want to use the script, exit it. //TODO: Replace with a dedicated download button
        checkloopID = setInterval(checkLoaded, 100); // Set a timer to check the state of the page and store its ID
    }, 1000);

    return;
})();

async function checkLoaded(){ // Function to check that the page has fully loaded
    if(document.querySelector(".download-button") === null) return; // If there are no download buttons, there are either no items (edge case) or the ajax-loaded items aren't there yet

    // if the page has been loaded
    clearInterval(checkloopID);   // Stop the checks
    await scanPage(); // and scrub the page

    return;
}

async function scanPage(){  // Page scrubbing function
    await downloadAllOnPage();  // Download everything here

    let next = document.querySelector("#search-results-next-page"); // Check if there is a next page
    if(next === null) return; // If not, return
    next.click(); // Else go to the next one
    if(++pageCounter > 99) {clearInterval(checkloopID); return;} else checkloopID = setInterval(checkLoaded, 100); // Safety Break after 99 (last) Storyblocks page

    return;
}

async function downloadAllOnPage(){ // Downloading routine
    let stockItems = Array.prototype.map.call(document.querySelectorAll(".stock-item"), e => [e.dataset.stockId, e.querySelectorAll("h3 a.text-black")[0].innerHTML]); // Parse out the IDs and names of the songs (every row is a <section> element with the 'stock-item' class, and it has a child with the title somewhere)
    //console.log(stockItems);

    let counter = 0;
    stockItems.forEach(async item => { // We have to use this kind of forEach (not for...of...) because this doesn't wait for the callbacks to finish
        //console.log(item);
        let apiJSON = await $.ajax({    // Could probably also use fetch, but I know how to use jQ ajax..
            type: "GET",    // Ask Storyblocks to verify our download
            url: `https:\/\/www.storyblocks.com\/audio\/download-ajax\/${item[0]}\/WAV`,
            dataType: "json", // Parse the recieved data as a JSON
        });

        let res = await fetch(apiJSON.data.downloadUrl); // Using the tokenized download URI we got back, fetch the original file
        let blob = await res.blob();  // Make it into a blob to be compatible with FileSaver.js
        saveAs(blob, `${item[1]}_${item[0]}.wav`); // Download the file

        if(++counter > 100 ) return; // Safety Break after 100th item!!!! (There should be only 45 on every page)
    });

    return;
}
