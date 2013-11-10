if (typeof window.Game === "undefined") {
  window.Game = {};
}

Game.ImageLoader = function() {
  this.initialize.apply(this, arguments);
};

(function(proto) {
  proto.initialize = function() {
    this.imgToLoad = [];
    this.counter = 0;
  }

  proto.addImage = function(path) {
    var img = new Image();
    img.src = path;

    img.addEventListener("load", this.imgDidLoad);

    this.imgToLoad.push(img);
    this.counter++;
  }

  proto.imgDidLoad = function(evt) {
  }
})(Game.ImageLoader.prototype);
