var assetManager = new AssetManager();

var app = {
  DEBUG:         true,
  snapFile:      'assets/snap.json',
  touchX:        null,
  touchY:        null,
  currentScroll: 0,
  currentSnap:   0,
  assets:        [],
  allAssets:     [],
  data:          [],
  snaps:         [],
  startedTF:     false,
  loadedTF:      false,
  title:         document.title,
  width:         $('main').width(),
  swipeThreshold: 6,

  init: function () {
    app.readFile(app.downloadAssets);
  },

  readFile: function(callback){
    $.getJSON(app.snapFile, function(data){
      app.data = data;
      for (var i = 0, d = null, l = data.length; i < l; i++) {
        d = data[i];
        if(d.cover){
          if(d.cover.image) app.addAssetManager('image', d.cover.image);
          if(d.cover.audio) app.addAssetManager('audio', d.cover.audio);
          if(d.cover.video) app.addAssetManager('video', d.cover.video);
        }
        if(d.content){
          if(d.content.type=='video') app.addAssetManager('video', d.content.src);
        }
        if(i==l-1) callback();
      }
    });
  },

  addAssetManager: function (type, path) {
    var index = app.assets.indexOf(path);
    if(index<0){
      app.allAssets.push({'type': type, 'path': path});
      app.assets.push(path);
      return app.allAssets.length - 1;
    }
    return index;
  },

  downloadAssets: function (){

    assetManager.constructor(app.allAssets, function(){
      for (var i = 0, d = null, l = app.data.length; i < l; i++) {
        d = app.data[i];
        if(d.cover){
          if(d.cover.audio) d.cover.audio = assetManager.getAsset(d.cover.audio);
          if(d.cover.video) d.cover.video = assetManager.getAsset(d.cover.video);
        }
        if(d.content){
          if(d.content.type=='video') d.content.src = assetManager.getAsset(d.content.src);
        }
      }
      app.start();
    });


    // update progress bar on screen
    var progressState = setInterval(function() {
      var progress = assetManager.progress();
      if (progress<100) {
        $('#progress-bar').css({'width': progress+'%'});
        document.title = progress+'% | '+app.title;
      }else{
        clearInterval(progressState);
        document.title = app.title;
      }
    }, 1000);
  },

  start: function () {
    if(!app.loadedTF){
      for (var i = 0, l = app.data.length; i < l; i++) {
        app.snap.create(i, app.data[i]);
        if(i==l-1) app.loadedTF = true;
      }
    }
    var time = setInterval(function(){
      if(app.loadedTF){
        $('#launcher').hide();
        app.eventListener();
        app.snap.init();
        app.snap.play(app.snap.getCurrent());
        clearInterval(time);
      }
    }, 1000);
  },

  eventListener: function () {
    // start snap story
    $('#snap0,.intro').on('click', function () {
      if(app.DEBUG) console.log('intro click.');
      if(!app.startedTF){
        app.toggleFullScreen();
        app.startedTF = true;
        for (var i = 0, snap = null, l = app.snaps.length; i < l; i++) {
          snap = app.snaps[i];
          if(snap.video) app.preload(snap.video[0]);
          if(snap.audio) app.preload(snap.audio[0]);
        }
      }
      app.snap.next();
    });

    // navigate using keyboard
    $(document).on('keydown', function(event){
      // left key
      if(event.keyCode==37) app.snap.previous();
      // up key
      else if(event.keyCode==38) app.snap.cover.show(true);
      // right key
      else if(event.keyCode==39) app.snap.next();
      // down key
      else if(event.keyCode==40) app.snap.content.show();
    });
  },

  getScroll: function () {
    var scroll = app.currentScroll;
    var width  = $('main').width();
    scroll = (scroll<0) ? 0 : scroll;
    if((scroll % width) !== 0) scroll = scroll - (scroll % width);
    return scroll;
  },

  stopMedia: function (media) {
    if(!media) return false;
    $(media).animate({volume: 0}, 500, function(){
      media.pause();
      media.currentTime = 0;
      media.muted       = true;
    });
  },

  playMedia: function (media, sound) {
    if(!media) return false;
    media.muted       = (sound===false) ? true : false;
    media.currentTime = 0;
    media.volume      = 1;
    media.play();
  },

  preload: function (media) {
    if(!media) return false;
    $(media).bind('canplaythrough', function(){
      $(media).get(0).play();
    });
    $(media).bind('progress', function(e) {
      // console.log(this.duration, this.buffered);
      if(this.duration>0) console.log($(this).get(0).currentSrc, 'Buffered: '+this.buffered.end(0)+'s');
    });
    $(media).get(0).volume = 0;
    // $(media).get(0).load();
    // $(media).get(0).play();
    // $(media).get(0).pause();
  },

  toggleFullScreen: function () {
    var docEl = document.documentElement;
    if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {
           if(docEl.requestFullscreen)       { docEl.requestFullscreen(); }
      else if(docEl.msRequestFullscreen)     { docEl.msRequestFullscreen(); }
      else if(docEl.mozRequestFullScreen)    { docEl.mozRequestFullScreen(); }
      else if(docEl.webkitRequestFullscreen) { docEl.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT); }
      else{}
    } else {
           if (document.exitFullscreen)      { document.exitFullscreen(); }
      else if(document.msExitFullscreen)     { document.msExitFullscreen(); }
      else if(document.mozCancelFullScreen)  { document.mozCancelFullScreen(); }
      else if(document.webkitExitFullscreen) { document.webkitExitFullscreen(); }
      else{}
    }
  },
};