const unusedForums = irrelevantForums.map((item) => item.toLowerCase());
const closedForums = closedThreadForums.map((item) => item.toLowerCase());

for (i = 0; i < characterNames.length; i++) {
  const kebabCharacter = characterNames[i].split(" ").join("-");
  const thisCharacterDiv = document.getElementById(kebabCharacter);
  const thisCharacter = characterNames[i];
  const owedThreadDiv = $("<div class='thread-list'></div>");
  const unowedThreadDiv = $("<div class='thread-list'></div>");
  const closedThreadDiv = $("<div class='thread-list'></div>");

  const buildTrackerDivs = function () {
    $(thisCharacterDiv).append(owedThreadDiv, unowedThreadDiv, closedThreadDiv);
    owedThreadDiv.append(`<p class="thread-title">Owed Threads</h1>`);
    unowedThreadDiv.append(`<p class="thread-title">Unowed Threads</h1>`);
    closedThreadDiv.append(`<p class="thread-title">Closed Threads</h1>`);
  };
  buildTrackerDivs();

  const processCharacterThreads = async (character) => {
      const defaultSearchInterval = 25;
    const initialSearchURL = `/index.php?act=Search&q=&f=&u=${encodeURIComponent(character)}&rt=topics`;
    let searchReturn;
    let finalSearchURL; 
    try {
      const initialSearchData = await $.get(initialSearchURL);
      let searchReturnBody = new DOMParser().parseFromString(initialSearchData, "text/html");
      let searchInitReturn = $('meta[http-equiv="refresh"]', searchReturnBody);

      if (searchInitReturn.length) {
        finalSearchURL = searchInitReturn.attr("content").substr(searchInitReturn.attr("content").indexOf("=") + 1);
        let finalSearchData;
        try {
          finalSearchData = await $.get(finalSearchURL);
        } catch (error) {
          owedThreadDiv.append('<div class="thread">Search Failed, this is likely an error with jcink. Refresh the page.</div>');
          return;
        }
        searchReturn = new DOMParser().parseFromString(finalSearchData, "text/html");
      } else {
        owedThreadDiv.append(`<div class="thread">This search failed. Does your character have posts in the tracked forum?</div>`);
        return;
      }
    } catch (error) {
      owedThreadDiv.append('<div class="thread">Search Failed, this is likely an error with jcink. Refresh the page.</div>');
     return;
    }

    let pages = 1
    if ($(".pagination_page", searchReturn).length) {
      pages = $(".pagination_page",  searchReturn).last().text() 
    }

    for (let j = 0; j < pages; j++) {
        if (j != 0 ) {
            let nextSearchUrl = finalSearchURL + "&st=" + j*defaultSearchInterval
            try {
                finalSearchData = await $.get(nextSearchUrl);
              } catch (error) {
                owedThreadDiv.append('<div class="thread">Search Failed, this is likely an error with jcink. Refresh the page.</div>');
                return;
              }
              searchReturn = new DOMParser().parseFromString(finalSearchData, "text/html");
        }
        $("#search-topics .tablebasic > tbody > tr", searchReturn).each((row, e) => {
          if (row > 0) {
            let cells = $(e).children("td");
            const forum = $(cells[3]).text().toLowerCase();
            const title = $(cells[2]).find("td:nth-child(2) > a").text();
            const characterName = thisCharacter.toLowerCase().split(" ")[0];
    
            if (!unusedForums.includes(forum) && !title.toLowerCase().includes(characterName)) {
              const threadDesc = $(cells[2]).find(".desc").text();
              const threadUrl = $(cells[7]).children("a").attr("href");
              const lastPoster = $(cells[7]).children("b").text();
              const myTurn = lastPoster.includes(thisCharacter) ? "unowed" : "owed";
    
              let postDate = $(cells[7]).html();
              postDate = postDate.substr(0, postDate.indexOf("<"));
              postDate.includes(",") ? (postDate = postDate.substring(0, postDate.indexOf(","))) : null;
    
              if (closedForums.includes(forum)) {
                closedThreadDiv.append($(`<div class="thread"><span class="closed">o</span> <a href="${threadUrl}">${title}</a><br/> <span class="threaddec">${threadDesc}</span></div>`));
              } else if (myTurn == "owed") {
                owedThreadDiv.append($(`<div class="thread"><span class="${myTurn}">-</span> <a href="${threadUrl}">${title}</a><br/> <span class="threaddesc">${threadDesc}<br /> Last Post: ${lastPoster} <br/><span class="date">${postDate}</span></div>`));
              } else {
                unowedThreadDiv.append($(`<div class="thread"><span class="${myTurn}">+</span> <a href="${threadUrl}">${title}</a><br/> <span class="threaddesc">${threadDesc}</span><br />Last Post: ${lastPoster} <br/><span class="date">${postDate}</span></div>`));
              }
            }
          }
        });
    }
    owedThreadDiv.has("div").length ? null : owedThreadDiv.append('<div class="thread empty">None at the moment!</div>');
    unowedThreadDiv.has("div").length ? null : unowedThreadDiv.append('<div class="thread empty">Get to work!</div>');
    closedThreadDiv.has("div").length ? null : closedThreadDiv.append(`<div class="thread empty">Some day you'll finish something.</div>`);
  };

  setTimeout(() => {
    processCharacterThreads(thisCharacter);
  }, i * floodControlValue);
}