var setGlobalStreamOptions = function() {
  if (process.env.NODE_ENV === 'test') {
    return {
      showControls: true,
      width: 320,
      height: 240,
      frameRate: 15,
      insertMode: 'append',
      publishAudio: true,
      publishVideo: true,
      constraints: {
        video: true,
        audio: true,
        fake: true
      }
    };
  } else {
    return {
      showControls: true,
      width: 320,
      height: 240,
      frameRate: 15,
      insertMode: 'append'
    };
  }
};

module.exports = setGlobalStreamOptions;