$(function () {
  var VERSION = 1.0;
  var options = {
    follow: 1,
    show: {
      event: 1,
      waypoint: 1,
      poi: 1,
      vista: 1,
      skill: 1,
      task: 1
    },
    connect: {
      address: 'localhost',
      port: '8428'
    }
  };
  var Player = {
    pos: [0, 0, 0]
  };
  var Maps = {};
  window.Maps = Maps; // for the sake of DEBUGGgggg
  // the map object
  var gmap, ll2p, p2ll;
  var init_map = function () {
    // Basis start
    gmap = new google.maps.Map(document.getElementById("map"), {
      zoom: 3,
      minZoom: 1,
      maxZoom: 7,
      center: new google.maps.LatLng(0, 0),
      streetViewControl: false,
      mapTypeId: "1", // string for gmaps' sake
      mapTypeControlOptions: {
        mapTypeIds: ["1", "2"]
      }
    });
    ll2p = function (ll) {
      var point = new google.maps.Point(0, 0),
        origin = new google.maps.Point(128, 128),
        tiles = 1 << max_zoom(),
        bound = function (value, min, max) {
          if (isNaN(min)) value = value < min ? min : value;
          if (isNaN(max)) value = value > max ? max : value;
          return value;
        },
        sin_y = bound(Math.sin(ll.lat() * (Math.PI / 180)), -0.9999, 0.9999);
      point.x = origin.x + ll.lng() * (256 / 360);
      point.y = origin.y + 0.5 * Math.log((1 + sin_y) / (1 - sin_y)) * -(256 / (2 * Math.PI));
      return new google.maps.Point(Math.floor(point.x * tiles), Math.floor(point.y * tiles));
    };
    p2ll = function (point) {
      var size = (1 << max_zoom()) * 256,
        lat = (2 * Math.atan(Math.exp((point.y - size / 2) / -(size / (2 * Math.PI)))) - (Math.PI / 2)) * (180 / Math.PI),
        lng = (point.x - size / 2) * (360 / size);
      return new google.maps.LatLng(lat, lng);
    };
    // GW2 stuff start
    var worldLabels = [],
      mapLabels = [],
      realMaps = [],
      max_zoom = function () {
        return gmap.getMapTypeId() === "1" ? 7 : 6;
      },
      get_tile = function (coords, zoom) {
        var mapId = gmap.getMapTypeId();
        if (coords.y < 0 || coords.x < 0 || coords.y >= (1 << zoom) || coords.x >= (1 << zoom)) {
          return "http://placehold.it/256/000000/000000";
        } else if ((mapId == "2") && (zoom > 2) && (coords.y <= (1 << zoom - 2) - 2)) {
          return "http://placehold.it/256/888888/ffffff";
        }
        return "https://tiles.guildwars2.com/" + mapId + "/1/" + zoom + "/" + coords.x + "/" + coords.y + ".jpg";
      },
      get_pixel = function (cr, mr, p) {
        // don't look at it. really! it will melt your brain and make your eyes bleed!
        return [(cr[0][0] + (cr[1][0] - cr[0][0]) * (p[0] - mr[0][0]) / (mr[1][0] - mr[0][0])), (cr[0][1] + (cr[1][1] - cr[0][1]) * (1 - (p[1] - mr[0][1]) / (mr[1][1] - mr[0][1])))];
      },
      reset = function (which, force) {
        switch (which) {
        case realMaps:
          if (realMaps.length == 0 || force) realMaps = {
            18: "Divinity's Reach",
            91: 'The Grove',
            139: 'Rata Sum',
            218: 'Black Citadel',
            326: 'Hoelbrak'
          };
          break;
        case worldLabels:
        case mapLabels:
          for (var i = 0; i < which.length; i++) which[i].setMap(null);
          which = [];
          break;
        default:
          console.log('reset-failed :p');
        }
      },
      Rect = {
        normalize: function (aRect) {
          if (isNaN(aRect[0])) {
            _.map(aRect, function (a) {
              return a + 0;
            });
          }
          return aRect;
        },
        fromArray: function (arrarr) { // left,top, width, height
          return [arrarr[0][0], arrarr[0][1], arrarr[1][0] - arrarr[0][0], arrarr[1][1] - arrarr[0][1]]
        },
        contains: function (aRect, pixel) {
          var p = {
            x: pixel.x || pixel[0],
            y: pixel.y || pixel[1]
          };
          return ((p.x >= aRect[0]) && (p.x < aRect[0] + aRect[2]) && (p.y >= aRect[1]) && (p.y < aRect[1] + aRect[3]));
        },
        toBounds: function (aRect) {
          Rect.normalize(aRect);
          return result = new google.maps.LatLngBounds(
            p2ll({
              x: aRect[0],
              y: aRect[1] + aRect[3]
            }),
            p2ll({
              x: aRect[0] + aRect[2],
              y: aRect[1]
            })
          );
        },
        toSmallBounds: function (aRect) {
          Rect.normalize(aRect);
        }
      },
      isInstance = function (ind, continent) {
        if (!continent) continent = gmap.getMapTypeId();
        return !(continent == 2) && !realMaps[ind];
      },
      fillFloor = function (a) {
        lastMap = !1;
        reset(realMaps, a);
        Maps = [];
        if (!realMaps.done) {
          $.getJSON('https://api.guildwars2.com/v1/map_names.json', function (arr) {
            for (var i = 0; i < arr.length; i++) {
              realMaps[arr[i].id] = arr[i].name;
            }
            realMaps.done = !0;
          });
        } else return setTimeout(fillFloor, 100);
        var continent = gmap.getMapTypeId();
        reset(worldLabels);
        reset(mapLabels);
        $.getJSON("https://api.guildwars2.com/v1/map_floor.json?continent_id=" + continent + "&floor=" + (continent == 1 ? 2 : 1) /*floor1 glitch..*/ , function (data) {
          ///
          console.log(data);
          for (var regionInd in data.regions) {
            var region = data.regions[regionInd];
            worldLabels.push(new Label({
              map: gmap,
              position: p2ll({ // Region-name
                x: region.label_coord[0],
                y: region.label_coord[1]
              }),
              text: region.name,
              max: 3,
              min: 0,
              css: 'color:tan;font-size:1.5em'
            }));
            for (var ind in region.maps) {
              var map = region.maps[ind];
              var cRect = Rect.fromArray(map.continent_rect);
              var cRectStr = cRect.join('|');
              var mRect = Rect.fromArray(map.map_rect);
              Maps[ind] = {
                raw: map,
                cRect: cRect,
                mRect: mRect
              };
              if (!isInstance(ind, continent)) {
                worldLabels.push(new Label({ // Map-name
                  map: gmap,
                  position: p2ll({
                    x: cRect[0] + cRect[2] / 2,
                    y: cRect[1] + cRect[3] / 2
                  }),
                  text: '<i>'+map.name +'</i>'+ (map.min_level + map.max_level ? '<br><small>' + (map.min_level == map.max_level ? map.max_level : map.min_level + '-' + map.max_level) + '</small>' : ''),
                  max: 7,
                  min: 3,                    
                  rect: cRect,
                  css: 'font-size:1.1em;'
                }));
              }
            } // each maps end
          } // each region end
        });
      },
      lastMap,
      autoPanToRect = function (aRect) {
        gmap.fitBounds(Rect.toBounds(aRect));
      },
      autoPan = function (aPointXY) {
        gmap.panTo(
          p2ll(aPointXY)
        );
      },
      getCurrentMap = function () {
        var c = ll2p(gmap.getCenter());
        for (var scanning in Maps) {
          if (!isInstance(scanning)) {
            if (Rect.contains(Maps[scanning].cRect, c)) {
              return scanning;
            }
          }
        }
        return false;
      },
      onMove = function (a) {
        var currentMap = getCurrentMap();
        if (currentMap && (lastMap != currentMap)) {
          lastMap = currentMap;
          onMapChange(currentMap);
        }
      },
      onMapChange = function (newMap) {
        fillMap(Maps[newMap].raw);
      },
      getCode = function(id){
        return "[&" + btoa(String.fromCharCode(4) + String.fromCharCode(id % 256) + String.fromCharCode(Math.floor(id / 256)) + String.fromCharCode(0) + String.fromCharCode(0)) + "]";
      },
      fillMap = function (map) {
        reset(mapLabels);
        for (var sector in map.sectors) {
          sector = map.sectors[sector];
          mapLabels.push(new Label({ // sector-name
            map: gmap,
            position: p2ll({
              x: sector.coord[0],
              y: sector.coord[1]
            }),
            text: sector.name + (sector.level ? '<small><br>' + sector.level + '</small>' : ''),
            max: 7,
            min: 6,
            css: 'font-size:.9em;color:silver;'
          }));
        }
        var types = {
          skill_challenges: 'skill',
          points_of_interest: 'poi',
          tasks: 'tasks'
        };
        for (var type in types) {
          for (var ind in map[type]) {
            var itm = map[type][ind];
            var _type = types[type];
            if (itm.type) _type = itm.type;
            var _text = itm.name?[itm.name]:[];
            var _desc = itm.objective?[itm.objective]:[];
            if (itm.poi_id || itm.task_id) {
              _desc.push('Chat code:'+getCode(itm.poi_id || itm.task_id));
            }
            if (itm.level) _text.push('<small>' + itm.level + '</small>');
            mapLabels.push(new Label({
              map: gmap,
              position: p2ll({
                x: itm.coord[0],
                y: itm.coord[1]
              }),
              text: '<img style="zoom:.5" src="images/icon-' + _type + '.png">' + (_text.length>0 ? '<small><br>' + _text.join('') + '</small>' : ''),
              desc: _desc.join('<br>'),
              max: 7,
              min: 4,
              sMin: 5,
              css: 'color:yellow;'
            }));
          } // itm
        } // type
      }, // fillmap
      grabGW2Linker = _.throttle(function () {
        var connect = options.connect,
          timeout = 5000;
        $.getJSON('http://' + connect.address + ':' + connect.port + '/gw2.json').success(function (data) {
          if (true || data.map.toLowerCase() == 'good')
            timeout = 200;
          onLinkReceived(data);
        }).error(function () {}).always(function () {
          setTimeout(grabGW2Linker, timeout)
        });
      }, 100),
      onLinkReceived = function (data) {
        if (data.map > 0) {
          Player = data;
          
        }
      },
      onMarkerClicked = function(e,that){
        console.log(e,that);
        if(that.rect){
          autoPanToRect(that.rect);
        } else if (that.desc) {
          popup.setContent(that.desc);
          popup.setPosition(that.position);
          popup.open(gmap);
        }
      },
      updatePlayer = function(){
        
      },      
      tile_size = new google.maps.Size(256, 256),
      popup = new google.maps.InfoWindow();
    // init half done!
    gmap.mapTypes.set("1", new google.maps.ImageMapType({
      maxZoom: 7,
      alt: "Tyria",
      name: "Tyria",
      tileSize: tile_size,
      getTileUrl: get_tile
    }));
    gmap.mapTypes.set("2", new google.maps.ImageMapType({
      maxZoom: 6,
      alt: "The Mists",
      name: "The Mists",
      tileSize: tile_size,
      getTileUrl: get_tile
    }));
    google.maps.event.addListenerOnce(gmap, "projection_changed", fillFloor);
    google.maps.event.addListener(gmap, "marker_click", onMarkerClicked);
    google.maps.event.addListener(gmap, "center_changed", _.throttle(onMove, 200));
    google.maps.event.addListener(gmap, "maptypeid_changed", function () {
      fillFloor(1);
    });
    grabGW2Linker(); // Self-setTimeout
  }; // init_map end
  init_map();
});