
var googleSuccess = function(){
  ko.applyBindings(new viewModel());
};

var googleError = function(){
  alert("Google Maps failed to load properly!");
  return;
};

var initMap = function(){
//the center of my map is the  ATT BLDG 909 Chestnut St.
    this.Zoom = 15;
    this.mapOptions = {
        zoom: this.Zoom,
        center: new google.maps.LatLng(38.627524, -90.194651),
        mapTypeId: google.maps.MapTypeId.ROADMAP
        };
    this.map =
        new google.maps.Map(document.getElementById('map'), this.mapOptions);
};

//This function calls wikipedia to display links to articles.
var CallWiki = function(wikiURL){
    var $wikiElem = $('#wikipedia-links');
// clear out old data before new request
    $wikiElem.text("");
// Wikipedia AJAX request

var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + wikiURL + '&format=json&callback=wikiCallback';
  $.ajax({
    url: wikiUrl,
    dataType: "jsonp",
    success: function( response ) {
      var articleList = response[1];
      var alen = articleList.length;
      for (var i =0; i < alen; i++){
        articleStr = articleList[i];
        var url = 'http://en.wikipedia.org/wiki/' + articleStr;
        $wikiElem.append('<li><a href ="' + url + '" target="_blank">' + articleStr + '</a></li>');
      }
    },error: function(errorMessage){
        $wikiElem.text("failed to get wikipedia resources");
      }
  });
};

var viewModel = function(){
    var self = this;
    //initialize the map
    self.initMap = new initMap();
    //keep track of number of markers
    self.pointCtr = 1;
    // set listVisible from index.html to true
    self.listVisible = ko.observable(true);
    //select current point
    self.selectPoint = function(point) {
    // store new point
    self.currentPoint(point);
    // call wikipedia routine with new point
    CallWiki(self.currentPoint().wikiURL);
      point.marker.setIcon(point.greenIcon);
    };
    // When mouse lands on marker or list item turn marker blue
    self.mouseOver = function(point) {
      point.marker.setIcon(point.blueIcon);
    };

    // When mouse lands on marker or list item turn marker red
    self.mouseLeave = function(point) {
      point.marker.setIcon(point.redIcon);
    };

    // This creates an array(collection) of locations(points)
    self.point = function(name, lat, long, wikiURL) {
      this.name = name;
      this.wikiURL = wikiURL;
      this.lat = lat;
      this.long = long;
      this.redicon = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
      this.blueIcon = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
      this.greenIcon = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";

      //map marker for this point
      this.marker = new google.maps.Marker({
        position: new google.maps.LatLng(lat, long),
        title: name,
        map: self.initMap.map,
        zIndex: self.pointCtr
      });

      // keep track of number of markers
      self.pointCtr++;

      // the bind in the below statements is used to preserve the context of the current object
      //https://docs.microsoft.com/en-us/scripting/javascript/advanced/using-the-bind-method-javascript

      // click event for this point's marker
      google.maps.event.addListener(this.marker, 'click', function() {
        self.selectPoint(this);
      }.bind(this));

      //mouseover event for this point's marker
      google.maps.event.addListener(this.marker, 'mouseover', function() {
        self.mouseOver(this);
      }.bind(this));

      //mouseout event for this point's marker
      google.maps.event.addListener(this.marker, 'mouseout', function() {
        self.mouseLeave(this);
      }.bind(this));
    };

    //this observable array is a collection array
    //http://knockoutjs.com/examples/collections.html
    self.points = ko.observableArray([
      new self.point('City Museum', 38.6336,
          -90.2006, 'City_Museum'),
      new self.point('Edward Jones Dome', 38.632912,
          -90.187706, 'Edward_Jones_Dome'),
      new self.point('AT&T', 38.627524,
          -90.194651, 'AT%26T_Center_(St._Louis)'),
      new self.point('Scott Trade Center', 38.626840,
          -90.202678, 'Scottrade_Center'),
      new self.point('Old Courthouse', 38.625674,
          -90.189274, 'Old_Courthouse_(St._Louis)'),
      new self.point('Busch Stadium', 38.622644,
          -90.192813, 'Busch_Stadium'),
    ]);

    //define the current selected point as an observable
    self.currentPoint = ko.observable();

    // A change in the filter will trigger changing our visible points
    self.pointFilter = ko.observable("");

   // show markers based on filter results.  Much of the syntax came from
   // http://www.knockmeout.net/2011/04/utility-functions-in-knockoutjs.html
    self.shownPoints = ko.computed(function() {
      return ko.utils.arrayFilter(self.points(), function(point) {
        return      (point.name.toLowerCase().indexOf(self.pointFilter().
                      toLowerCase()) !== -1);
      });
    }, self);

    // the subscribe function is called whenever any properties of the
    // ko.computed variable shownPoints changes
    self.shownPoints.subscribe(function() {
      self.toggleMarkers();
      //  clears the wikipedia link section if a new filter entry has occured
      var $wikiElem = $('#wikipedia-links');
      $wikiElem.text("");
    });

    // show only filtered items using .slice()
    self.listPoint = ko.observable();
    self.shownList = ko.computed(function(){
    return self.shownPoints().slice(self.listPoint());
    });

    // we get here anytime we need to refigure shown markers(filter)
    // toggle markers back to Red
    self.toggleMarkers = function(){
      var pointsLen = self.points().length;
      for (var i = 0; i < pointsLen; i++) {
        var thisPoint = self.points()[i];
        // hide all markers, and revert back to red
        thisPoint.marker.setVisible(false);
        thisPoint.marker.setIcon(thisPoint.redIcon);
      }
      var visiblePoints;
        for (i = 0; i < pointsLen; i++) {
          //Show filtered Markers
          visiblePoints = self.shownPoints()[i];
          if (visiblePoints) {visiblePoints.marker.setVisible(true);} // turn on only needed markers
        }
    };

    // resize map to fit any window, code  modified from
    // http://grapsus.net/blog/post/Google-API-v3-fit-map-zoom-and-bounds-to-all-markers

    self.refitMap = function() {
        var bounds = new google.maps.LatLngBounds();
        var pointsLength = self.shownPoints().length;
        if(pointsLength >= 2) {
            for (var i = 0; i < pointsLength; i++) {
                bounds.extend (self.shownPoints()[i].marker.position);
            }
            self.initMap.map.fitBounds(bounds);
        }
    };

    // resize map if screen size changes
    $(window).resize(function () {
        self.refitMap();
    });

    // set bounds of map on startup and  when screen size changing
    self.refitMap();

};
