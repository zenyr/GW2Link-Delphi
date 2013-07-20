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
  var Servers = {};
  var Events = {};
  // the map object
  var gmap;
  var init_map = function () {
    // Basis start
    google.maps.visualRefresh = !0;
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
    var ll2p = function (ll) {
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
    var p2ll = function (point) {
      var size = (1 << max_zoom()) * 256,
        lat = (2 * Math.atan(Math.exp((point.y - size / 2) / -(size / (2 * Math.PI)))) - (Math.PI / 2)) * (180 / Math.PI),
        lng = (point.x - size / 2) * (360 / size);
      return new google.maps.LatLng(lat, lng);
    };
    // GW2 stuff start
    var worldLabels = [],
      mapLabels = [],
      eventLabels = [],
      realMaps = [],
      max_zoom = function () {
        return gmap.getMapTypeId() === "1" ? 7 : 6;
      },
      Get = {
        tile: function (coords, zoom) {
          var mapId = gmap.getMapTypeId();
          if (coords.y < 0 || coords.x < 0 || coords.y >= (1 << zoom) || coords.x >= (1 << zoom)) {
            return "http://placehold.it/256/000000/000000";
          } else if ((mapId == "2") && (zoom > 2) && (coords.y <= (1 << zoom - 2) - 2)) {
            return "http://placehold.it/256/888888/ffffff";
          }
          return "https://tiles.guildwars2.com/" + mapId + "/1/" + zoom + "/" + coords.x + "/" + coords.y + ".jpg";
        },
        map: function (force) {
          if (force || !Player.map) {
            var c = ll2p(gmap.getCenter());
            for (var scanning in Maps) {
              if (!is.instance(scanning)) {
                if (Rect.contains(Maps[scanning].cRect, c)) {
                  return scanning;
                }
              }
            }
          } else return Player.map;
          return false;
        },
        chatCode: function (type, id) {
          return "[&" + btoa(String.fromCharCode(type) + String.fromCharCode(id % 256) + String.fromCharCode(Math.floor(id / 256)) + String.fromCharCode(0) + String.fromCharCode(0)) + "]";
        }
      },
      Draw = {
        eventMarkers:function(){
          reset(eventLabels);
          var mapInd = Get.map(1),map = Maps[mapInd];
          if(!map) return setTimeout(Draw.eventMarkers,100);
          for (var idx in map.events){
            var uid = map.events[idx].event_id,
              event = Events[uid],status = map.events[idx].state,
              skip={Inactive:1,Warmup:2,Fail:1,Active:3,Success:1,Preperation:2}[status]-1;

            if(skip>1 && event) {
              var ll = pos2ll({x:event.location.center[0],y:event.location.center[1]},mapInd,1);
              var radius = event.location.radius || 1000;
              radius = radius / map.mRect[2] * map.cRect[2];
              switch (event.location.type) {
              case 'poly':   
                //TODO : Poly events.. :/ 
              case 'sphere': 
              case 'cylinder':
                var circle = new EventMarker({ 
                  map: gmap,
                  position: ll,
                  flags: event.flags,
                  status : skip,
                  desc: event.name,
                  radius: radius
                });
                  eventLabels.push(circle);
              break;
              default : 
                console.log ('unknown event type:',event)
              }
            }
          } 
          Draw.mapMarkers();
        },
        worldMarkers: function (data) {
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
              if (!is.instance(ind)) {
                worldLabels.push(new Label({ // Map-name
                  map: gmap,
                  position: p2ll({
                    x: cRect[0] + cRect[2] / 2,
                    y: cRect[1] + cRect[3] / 2
                  }),
                  text: '<i>' + map.name + '</i>' + (map.min_level + map.max_level ? '<br><small>' + (map.min_level == map.max_level ? map.max_level : map.min_level + '-' + map.max_level) + '</small>' : ''),
                  max: 6,
                  min: 3,
                  rect: cRect,
                  css: 'font-size:1.1em;'
                }));
              }
            } // each maps end
          } // each region end        
        },
        mapMarkers: function (map) {
          var types = {
            skill_challenges: 'skill',
            points_of_interest: 'poi',
            tasks: 'tasks'
          };
          map = map||Maps[Get.map(1)].raw;
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
          for (var type in types) {
            for (var ind in map[type]) {
              var itm = map[type][ind];
              var _type = types[type];
              if (itm.type) _type = itm.type;
              var _text = itm.name ? [itm.name] : [];
              var _desc = itm.objective ? [itm.objective] : _text[0] ? [_text[0]] : [];
              if (itm.poi_id) {
                _desc.push('<small>Chat code: ' + Get.chatCode(4, itm.poi_id) + '</small>');
              }
              if (itm.level) _text.push(itm.level);
              mapLabels.push(new Label({
                map: gmap,
                position: p2ll({
                  x: itm.coord[0],
                  y: itm.coord[1]
                }),
                text: '<img src="images/icon-' + _type + '.png">' + (_text.length > 0 ? '<small><br>' + _text.join('') + '</small>' : ''),
                desc: _desc.join('<br>'),
                max: 7,
                min: 4,
                sMin: 5,
                css: 'color:#dff;'
              }));
            } // itm
          } // type
        }, // draw.mapMarkers
        player : function () {
          var ll = pos2ll({
            x: Player.pos[0],
            y: Player.pos[2]
          }, Player.map);
          if (Player.up && ll) {
            if (!Player.marker) {
              Player.marker = new PlayerMarker({
                map: gmap,
                pos: ll
              });
            } else {
              Player.marker.setValues({
                prot: Player.prot,
                crot: Player.crot,
                pos: ll
              });
              Player.marker.draw();
            }
            gmap.panTo(ll);
          }
        }
      },
      Populate = {
        linker: _.throttle(function () {
          var connect = options.connect,
            timeout = 5000;
          $.getJSON('http://' + connect.address + ':' + connect.port + '/gw2.json').done(
            function (data) {
              data.up = !data.code;
              on.linkReceived(data);
              if (data.up) timeout = 100;
            }).
          always(function () {
            setTimeout(Populate.linker, timeout)
          });
        }, 50),
        server: function () {
          Servers = {};
            $.getJSON('https://api.guildwars2.com/v1/world_names.json').done(function (data) {
              var itms=['<option>Server</option>'];
              for(var i in data) {
                i = data[i];
                Servers[i.id] = i.name;
                itms.push('<option value="'+i.id+'">'+i.name+'</option>');
              }
              $('#opt-server').html('<select id="cb-server">'+itms.join('')+'</select>');
              Servers.done = !0;
              Servers.current = 0;
              Servers.getName = function(ind){
                return Servers[ind]||'('+ind+')';
              };
              Servers.syncCb = function(){
                if ($('#cb-server option').filter(function(){
                   return this.value == Servers.current; 
                }).prop('selected',!0)) Draw.eventMarkers();
              }
            });
        },
        world: function () {
          console.log('PopWorld');
          lastMap = !1;
          reset(realMaps);
          Maps = [];
          if (!realMaps.done && !realMaps.pending) {
            realMaps.pending = !0;
            $.getJSON('https://api.guildwars2.com/v1/map_names.json').done(function (arr) {
              for (var i = 0; i < arr.length; i++) {
                realMaps[arr[i].id] = arr[i].name;
              }
              realMaps.done = !0;
              realMaps.pending = !1;
            });
            return setTimeout(Populate.world, 100); 
          }
          var continent = gmap.getMapTypeId();
          reset(worldLabels);
          reset(mapLabels);
          $.getJSON("https://api.guildwars2.com/v1/map_floor.json?continent_id=" + continent + "&floor=" + (continent == 1 ? 2 : 1) /*floor1 glitch..*/).done(Draw.worldMarkers);
        }, // populate.world
        eventNames:function(){
          $.getJSON("https://api.guildwars2.com/v1/event_details.json").done(function(_data){
              Events = _data.events;
              Events.done = !0;
              Events.pending = !1;
          });        
        },
        event : function(){
          var mapInd = Get.map(1);
          var server = Servers.current || 0;
          var data;
          if(!server) return false;
          if(!Events.done) {
            if(!Events.pending) {
              Events.pending = !0;
              Populate.eventNames();
            }
            return setTimeout(Populate.event,100);
          }
         $.getJSON("https://api.guildwars2.com/v1/events.json?world_id=" + server + "&map_id=" + mapInd).done(function(_data){
            var map = Maps[mapInd];
            if(!map) return console.log('unknown-map:',mapInd);
            map.events = _data.events;
            Draw.eventMarkers();
          });
        }
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
        case eventLabels:
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
      is = {
        instance: function (ind, continent) {
          if (!continent) continent = gmap.getMapTypeId();
          return !(continent == 2) && !realMaps[ind];
        },
        popupIntended: !1,
        markerIntended: !0
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
      lastValidCenter,
      on = {
        move: function (a) {
          var allowedBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(-89, -179),
            new google.maps.LatLng(89, 179)
          )
          if (!lastValidCenter || allowedBounds.contains(gmap.getCenter())) {
            lastValidCenter = gmap.getCenter();
          } else return gmap.panTo(lastValidCenter);
          var currentMap = Get.map(1);
          if (currentMap && (lastMap != currentMap)) {
            lastMap = currentMap;
            on.mapChange(currentMap);
          }
        },
        mapChange: function (newMap) {
          if(!newMap) newMap = Get.map();
          Draw.mapMarkers(Maps[newMap].raw);
          Populate.event();
        },
        serverChange : function(e){
          if(e) Servers.current = $(this).val();
          on.mapChange();
        },
        mapDragEnd: function () {
          if (is.markerIntended) {
            is.markerIntended = !1;
            setTimeout(function () {
              is.markerIntended = !0;
            }, 100);
          }
        },
        linkServerChange: function () {
          //TODO : linker server has changed -> change gmap mode, pop world, trigger mapChange.
        },
        linkMapChange: function () {
          on.mapChange(data.map);
        },
        linkReceived: function (data) {
          if (data.map > 0) {
            $.extend(Player, data);
            Draw.player();
            if(Servers.done && Servers.current!= data.server){
              Servers.current = data.server;
              Servers.syncCb();
              Populate.event();
            }
          }
        },
        mapClick: function (e) {
          if (!is.popupIntended) popup.close();
          if(window.debugHook) console.log(e.latLng, ll2p(e.latLng));
        },
        markerClick: function (e, that) {
          var $that = $(that);
          if ( !$that.is('.event-marker div')  && (!is.markerIntended || $that.is('small,span,div')))  {
            is.markerIntended = !0;
            return;
          }
          if (that.rect) {
            autoPanToRect(that.rect);
          } else if (that.desc) {
            is.popupIntended = !0;
            popup.setContent(that.desc);
            popup.setPosition(that.position);
            popup.open(gmap);
            setTimeout(function () {
              is.popupIntended = !1
            }, 100);
          }
        }
      },
      pos2ll = function (oXY, mapInd, isEvent) {
        var map = mapInd || Get.map();
        var inch = !isEvent?39.3700787:1;
        map = map ? Maps[map] : false;
        var result = {};
        if (map) {
          result.x = (oXY.x * inch - map.mRect[0]) / map.mRect[2];
          result.y = (oXY.y * inch - map.mRect[1]) / map.mRect[3];
          result.y = 1 - result.y;
          result.x = map.cRect[0] + map.cRect[2] * result.x;
          result.y = map.cRect[1] + map.cRect[3] * result.y;
          return p2ll(result);
        }
        return false;
      },
      tile_size = new google.maps.Size(256, 256),
      popup = new google.maps.InfoWindow();
    // init var end
    // Options binding begin
      $('#float').on('change','#cb-server',on.serverChange)
    // Options binding end
    gmap.mapTypes.set("1", new google.maps.ImageMapType({
      maxZoom: 7,
      alt: "Tyria",
      name: "Tyria",
      tileSize: tile_size,
      getTileUrl: Get.tile
    }));
    gmap.mapTypes.set("2", new google.maps.ImageMapType({
      maxZoom: 6,
      alt: "The Mists",
      name: "The Mists",
      tileSize: tile_size,
      getTileUrl: Get.tile
    }));
    google.maps.event.addListener(gmap, "click", on.mapClick);
    google.maps.event.addListener(gmap, "dragend", on.mapDragEnd);
    google.maps.event.addListenerOnce(gmap, "projection_changed", Populate.world);
    //    google.maps.event.addDomListener(gmap, "dblclick", on.dblClick);
    google.maps.event.addListener(gmap, "marker_click", on.markerClick);
    google.maps.event.addListener(gmap, "center_changed", _.throttle(on.move, 200));
    google.maps.event.addListener(gmap, "maptypeid_changed",  Populate.world);
    Populate.linker();  // Linker: Auto repeat 
    Populate.server(); 
    setInterval(Populate.event,5000);
  }; // init_map end
  init_map();
});