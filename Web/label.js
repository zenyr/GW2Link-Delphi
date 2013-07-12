function Label(opt_options) {
  // Initialization
  var that = this;
  this.setValues(opt_options);
  // Label specific
  var span = this.span_ = document.createElement('span');
  span.style.cssText = (this.get('css') || '') + ';top: -0.5em;';
  var div = this.div_ = document.createElement('div');
  div.appendChild(span);
  div.style.cssText = 'position: absolute; display: none';
  if (this.rect || this.desc) {
      google.maps.event.addDomListener(div, 'click', function(e) {
          google.maps.event.trigger(that.getMap(), 'marker_click', e, that);
      });
    span.className += 'label-clickable';
  }
  this.v_ = !1;
};
Label.prototype = new google.maps.OverlayView;
// Implement onAdd
Label.prototype.onAdd = function () {
  var pane = this.rect ? this.getPanes().overlayMouseTarget : this.getPanes().overlayLayer;
  this.span_.innerHTML = (this.get('text') || '').toString();
  pane.appendChild(this.div_);
  // Ensures the label is redrawn if the text or position is changed.
};
// Implement onRemove
Label.prototype.onRemove = function () {
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
    div.className = (zoom >= sMin ? 'label' : 'label-hide-small')
  }
};