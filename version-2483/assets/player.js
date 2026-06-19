function initMoviePlayer(streamUrl) {
  var video = document.querySelector('[data-player-video]');
  var cover = document.querySelector('[data-player-cover]');
  var message = document.querySelector('[data-player-message]');
  var hls = null;

  function showMessage(text) {
    if (message) {
      message.textContent = text;
      message.classList.add('show');
    }
  }

  function attach() {
    if (!video || !streamUrl) {
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.ERROR, function (event, data) {
        if (data && data.fatal) {
          if (hls) {
            hls.destroy();
            hls = null;
          }
          video.src = streamUrl;
        }
      });
      return;
    }

    video.src = streamUrl;
  }

  function start() {
    if (!video) {
      return;
    }
    if (cover) {
      cover.classList.add('hidden');
    }
    var action = video.play();
    if (action && typeof action.catch === 'function') {
      action.catch(function () {
        showMessage('播放暂时不可用，稍后再试');
      });
    }
  }

  attach();
  if (cover) {
    cover.addEventListener('click', start);
  }
  if (video) {
    video.addEventListener('click', function () {
      if (video.paused) {
        start();
      }
    });
  }
}
