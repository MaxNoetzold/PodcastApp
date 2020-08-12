// all function that are needed for the gui to work

// function of the play button to set the $manifestUri and starting the player
function playPodcast(event, manifestID, title, length) {
  // the card should not turn if a button is clicked
  event.stopPropagation();

  manifestUri = getManifestUri(manifestID);

  currentPlayingName = title;
  currentPlayingDuration = "/" + convertSecondsToString(length);
  loadNewManifestIntoPlayer();
  storeLastPlayed();
}
