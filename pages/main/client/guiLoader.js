/*
Main Functions:
   getNewPodcasts()
    - loads latest known podcast from indexedDB and asks server if newer
      data is available
    - load missing data from server and safe it in indexedDB
    - if new data loaded: show it with renderCard()
   renderOneRowOfCards()
    - renders 1/2/3 cards (for each display width one row of cards is different)
    - and checks if screen is now full, if not render one more row: checkIfScreenIsFull()
   initFooterWidth()
    - change the width of the player footer to:
       full width - scrollbarWidth
   showPageVersion
    - shows current version on top left corner
    - to easier know if screenshots from bugs happened in latest version (or an older one)

--------------------------------------------------------------------------------

Podcast-Card Metadata:
   - saved in two indexedDB stores:
   cardStore: html cards (generated from server) for all podcasts the user is
              allowed to see;
                key: manifestID
                value: string that represents a DOM element (the podcast card)
   podcastsMetaStore:
              1. all category names the user is allowed to see
                  key: "categorieNames"
                  value: array of strings which are category names
              2. sorted arrays (latest is [0]) of each category
                 plus no-category (all) with each fitting manifestID
                  key: categorieName
                  value: array of strings which are manifestIDs
              3. latestKnownPodcastID

--------------------------------------------------------------------------------

Helper Functions:
   renderOneRowOfCards(category = "no-category")
    - renders 1/2/3 cards (for each display width one row of cards is different)
    - and checks if screen is now full, if not render one more row: checkIfScreenIsFull()
   checkIfScreenIsFull(category)
    - checks if current page height is greater than the screen height + scrollDown
    - if not render one row of cards for the given $category
   renderCard(manifestID, card, onTop = false)
    - creates a new div element and adds the $card into it if the $manifestID is not already rendered

--------------------------------------------------------------------------------
*/

// an array of manifestIDs of rendered cards
let allCards;

// on every scroll event check if new cards need to be rendered
window.addEventListener('scroll', function(e) {
  checkIfScreenIsFull("no-category");
});

/*
  getNewPodcasts()
   - loads latest known podcast from indexedDB and asks server if newer
     data is available
   - load missing data from server and safe it in indexedDB
   - if new data loaded: show it with renderCard()
*/
function getNewPodcasts() {
  // load data from server
  fetch("/getLatestPodcastID", {
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  }).then(response => {
    response.text().then(latestID => {
      // test if server data is newer than known data
      podcastsMetaStore.getItem('latestPodcastID').then(function(value) {
				// return if no new podcasts on server
				if (value && value === latestID) {
          return;
				}

        // get all podcasts
        //  it would be more efficient if I only load the podcasts that got
        //  published since my last known podcast
        //  but it could happen that podcasts get published recently
        //  which are older; than there would be no way to get them
        fetch("/getCards", {
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          }
        }).then(response => {
          response.json().then(podcasts => {
            // save them in indexedDB
            // and render them
            // we go in reversed order so the new loaded podcasts get rendered on top of the page
            podcasts.slice().reverse().forEach(podcast => {
              // check if the podcast is already known
              // if no it gets rendered (bc it should be newer than the last rendered one, if not whatever)

              // this is always ineffecient when there are "a lot" of new cards (e.g. on first render),
              // bc we always load them, doesnt matter if they are visible or not
              // this is caused by the offline first approach:
              //   we always want to render all known cards without first checking the internet for new ones
              //   and this is the totally correct way to do it!
              //   instead of not rendering them, we use a control system that deletes not visible content
              //   but only the content, not the div, so the height of the rendered page stays the same
              // TODO: Function that deletes not visible card content & decides for renderCard if the content has to be rendered anyways

              cardStore.getItem(podcast.manifestID).then(value => {
                if (!value || value === null) {
                  renderCard(podcast.manifestID, podcast.card, true);
        				}
              })
              // safe the podcast card always in indexedDB to have the latest version of it
              cardStore.setItem(podcast.manifestID, podcast.card).catch(function(err) {
            		debugLogging("guiLoader.js-getNewPodcasts(): Error for setting card: " + err);
            	});
            });
          });
        });

        // together with the podcast cards we need the ordered manifestIDs as metadata
        fetch("/getManifestIDs", {
          headers: {
            'Content-Type': 'application/json; charset=utf-8'
          }
        }).then(response => {
          response.json().then(manifestIDs => {
            // save them in indexedDB
            podcastsMetaStore.setItem("no-category", manifestIDs).catch(function(err) {
          		debugLogging("guiLoader.js-getNewPodcasts(): Error for setting manifestIDs: " + err);
          	});
          });
        });

        // save the latest PodcastID in indexedDB
        podcastsMetaStore.setItem('latestPodcastID', latestID).catch(function(err) {
      		debugLogging("guiLoader.js-getNewPodcasts(): Error for setting latestPodcastID: " + err);
      	});
      });
    });
  });
}

/*
  renderOneRowOfCards
   - renders 1/2/3 cards (for each display width one row of cards is different)
   - and checks if screen is now full, if not render one more row: checkIfScreenIsFull()
*/
function renderOneRowOfCards(category = "no-category") {
  // as defined in style.css there are either (depending on window width)
  // 1 (<700px), 2 (>=700px) or 3 (>=1200px) cards per row
  let cardsPerRow = 1;
  if (document.body.clientWidth >= 700) {
    cardsPerRow = 2;
  }
  if (document.body.clientWidth >= 1200) {
    cardsPerRow = 3;
  }

  // get all podcasts in an ordered array
  podcastsMetaStore.getItem(category).then(async function(manifestIDs) {
    // this should only happen on first startup and its not necessary to do
    // sth about it bc the getNewPodcasts will render all necessary podcasts
    // anyways
    if (!manifestIDs || manifestIDs === null) {
      return;
    }

    let j = 0;
    // start with the $i = allCards.length (the next index in the manifestIDs array)
    for (let i = allCards.length; i < manifestIDs.length && j < cardsPerRow; i++) {
      // check that for each function call only one row gets rendered
      j++;

      // get the card information of that manifestID and render it
      await cardStore.getItem(manifestIDs[i]).then(card => {
        renderCard(manifestIDs[i], card);
      });
    }
    // if all podcasts are rendered we dont have to test if its full, it doesnt matter
    if (allCards.length >= manifestIDs.length) {
      return;
    }
    // check if more cards have to be rendered
    checkIfScreenIsFull(category);
  });
}

/*
  renderCard(manifestID, card, onTop = false)
   - creates a new div element and adds the $card into it if the $manifestID is not already rendered
*/
function renderCard(manifestID, card, onTop = false) {
  // check if card with the same manifestID got already rendered
  for (i = 0; i < allCards.length; i++) {
    if (allCards[i] === manifestID) {
      return;
    }
  }
  // add manifestID to allCards so it will not be rendered again
  allCards.push(manifestID);

  // create card DOM element
  let cardEl = document.createElement("div");
  cardEl.classList.add("card");
  cardEl.innerHTML = card;

  // add it at the correct position
  if (onTop) {
    document.getElementById("archiveCardContainer").prepend(cardEl);
  } else {
    document.getElementById("archiveCardContainer").appendChild(cardEl);
  }

  // init download button appearance in download.js
  initDownloadButton(manifestID);

  // init progress bars in podcastTimers.js
  initProgress(manifestID);
}

/*
  checkIfScreenIsFull(category)
   - checks if current page height is greater than the screen height + scrollDown
   - if not render one row of cards for the given $category
*/
function checkIfScreenIsFull(category) {
  // document height is hard to get but the height of the main div gets pretty close
  let documentHeight = document.getElementById("main").scrollHeight;
  let windowHeight = window.innerHeight;

  // first check if the main div itself is smaller than the window
  if (documentHeight < windowHeight) {
    renderOneRowOfCards(category);
    return;
  }

  let safeHeight = windowHeight * 0.15;
  let scrollDown = window.scrollY;

  // check if amount of "leftover" already rendered documentHeight is at least safeHeight or renderOneRowOfCards()
  if (documentHeight - safeHeight < windowHeight + scrollDown) {
    renderOneRowOfCards(category);
  }
}

/*
  initFooterWidth()
   - change the width of the player footer to:
      full width - scrollbarWidth
*/
function initFooterWidth() {
  document.getElementById("footer").style.width = (document.getElementById("footer").offsetWidth - getScrollbarWidth()) + "px";
}

function getScrollbarWidth() {
  return window.innerWidth - document.documentElement.clientWidth;
}

/*
	showPageVersion
	 shows current version on top left corner
	 to easier know if screenshots from bugs happened in latest version (or an older one)
*/
function showPageVersion(message = "") {
	document.getElementById("PageVersion").innerHTML = "V" + PAGE_VERSION + message;
}
