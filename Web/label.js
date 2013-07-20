function Label(opt_options) {
  // Initialization
  var that = this;
  this.setValues(opt_options);
  // Label specific
  var span = this.span_ = document.createElement('span');
  span.style.cssText = (this.get('css') || '');
  var div = this.div_ = document.createElement('div');
  div.appendChild(span);
  div.style.cssText = 'position: absolute; display: none';
  if (this.rect || this.desc) {
    google.maps.event.addDomListener(span, 'click', function (e) {
      google.maps.event.trigger(that.getMap(), 'marker_click', e, that);
    });
    span.className += 'label-clickable';
  }
  this.v_ = !1;
};
Label.prototype = new google.maps.OverlayView;
Label.prototype.onAdd = function () {
  var pane = this.rect ? this.getPanes().overlayMouseTarget : this.getPanes().overlayLayer;
  this.span_.innerHTML = (this.get('text') || '').toString();
  pane.appendChild(this.div_);
  // Ensures the label is redrawn if the text or position is changed.
};
// Implement onRemove
Label.prototype.onRemove = function () {
  if (this.click_) google.maps.event.clearInstanceListeners(this.span);
  this.div_.parentNode.removeChild(this.div_);
};
// Implement draw
Label.prototype.draw = function () {
  var projection = this.getProjection();
  var position = projection.fromLatLngToDivPixel(this.get('position'));
  var div = this.div_;
  var min = this.min || 0;
  var max = this.max || 7;
  var sMin = this.sMin || min;
  var zoom = this.map.getZoom();
  var currVis = this.v_;
  var shouldVis = (zoom >= min) && (zoom <= max);
  if (currVis != shouldVis) {
    div.style.display = (shouldVis ? 'block' : 'none');
    this.v_ = shouldVis;
  }
  if (shouldVis) {
    div.style.left = position.x + 'px';
    div.style.top = position.y + 'px';

    div.className = 'label ' + (zoom >= sMin ? '' : 'label-hide-small')
  }
};
//////////////////////////////////////

function PlayerMarker(opt_options) {
  var that = this;
  this.setValues(opt_options);
  var span = document.createElement('span');
  var crot = this.crot_ = document.createElement('img');
  var prot = this.prot_ = document.createElement('img');
  var div = this.div_ = document.createElement('div');
  this.v_ = false;
  crot.src = 'images/icon-crot.png';
  crot.className = 'crot';
  prot.src = 'images/icon-prot.png';
  prot.className = 'prot';
  this.input_ = {};
  this.deg_ = {};
  span.appendChild(crot);
  span.appendChild(prot);
  div.appendChild(span);
  div.className = 'marker';
  div.style.cssText = 'position: absolute; display: none;color:red;';
};
PlayerMarker.prototype = new google.maps.OverlayView;
PlayerMarker.prototype.onAdd = function () {
  var pane = this.getPanes().overlayLayer;
  pane.appendChild(this.div_);
  // Ensures the label is redrawn if the text or position is changed.
};
// Implement onRemove
PlayerMarker.prototype.onRemove = Label.prototype.onRemove;
// Implement draw
PlayerMarker.prototype.draw = function () {
  var that = this;
  var projection = this.getProjection();
  var position = projection.fromLatLngToDivPixel(this.get('pos'));
  var div = this.div_;
  var currVis = this.v_;
  var shouldVis = position.x * position.y != 0;
  var getDeg = function (type, target) {
    target = target || 0;
    var lastIn = that.input_[type] || 0;
    var lastDeg = that.deg_[type] || 0;
    var diff = target - lastIn;
    that.input_[type] = target;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    that.deg_[type] = (that.deg_[type] || 0) + diff;
  };
  if (currVis != shouldVis) {
    div.style.display = (shouldVis ? 'block' : 'none');
    this.v_ = shouldVis;
  }
  if (shouldVis) {
    div.style.left = position.x + 'px';
    div.style.top = position.y + 'px';
    getDeg('c', this.get('crot'));
    getDeg('p', this.get('prot'));
    this.prot_.style.transform = this.prot_.style.webkitTransform = 'rotate(' + (-this.deg_['p'] || 0) + 'deg)';
    this.crot_.style.transform = this.crot_.style.webkitTransform = 'rotate(' + (-this.deg_['c'] || 0) + 'deg)';
  }
};

/////////////////////////

function EventMarker(opt_options) {
  // Initialization
  var that = this;
  this.setValues(opt_options);
  // Label specific

  var div = this.div_ = document.createElement('div');
  div.innerHTML = '&nbsp';

  google.maps.event.addDomListener(div, 'click', function (e) {
    google.maps.event.trigger(that.getMap(), 'marker_click', e, that);
  });
  div.className = 'event-area';
  this.v_ = !1;
};
EventMarker.prototype = new google.maps.OverlayView;
EventMarker.prototype.onAdd = function () {
  var pane = this.getPanes().overlayLayer;
  pane.appendChild(this.div_);
  this.div_ = $(this.div_);
  // Ensures the label is redrawn if the text or position is changed.
};
// Implement onRemove
EventMarker.prototype.onRemove = function () {
  google.maps.event.clearInstanceListeners(this.div_[0]);
  this.div_.remove();
};
// Implement draw
EventMarker.prototype.draw = function () {
  var projection = this.getProjection();
  var position = projection.fromLatLngToDivPixel(this.get('position'));
  var div = this.div_;
  var min = this.min || 0;
  var max = this.max || 7;

  var zoom = this.map.getZoom();
  var currVis = this.v_;
  var shouldVis = (zoom >= min) && (zoom <= max);
  var flags = this.get('flags')||[];
  if (currVis != shouldVis) {
    div.css({display:shouldVis ? 'block' : 'none',borderColor:['#fff','#38b','#fc2'][this.get('status')]});
    if(flags[0])
      div.css({borderColor:'#a33'});
    this.v_ = shouldVis;
  }
  if (shouldVis) {
    var r = this.radius / Math.pow(2,7-zoom);
    div.css({borderRadius:r/2,left:position.x-r/2,top:position.y-r/2,width:r,height:r});
  }
};