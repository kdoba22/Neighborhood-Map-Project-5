/**
 * This file is the primary javascript
 */
var TheMap = function(){
/*the below latitude and longitude points represent the center of my map
  center: { lat: 38.627524, lng: -90.194651},  ATT BLDG 909 Chestnut St. } */
   var lat  = 38.627524;
   var long = -90.194651;
    this.Zoom = 15;
    this.mapOptions = {
        zoom: this.Zoom,
        //draggable: false,
        //scrollwheel: false,
        panControl: false,
        disableDefaultUI: true,
        center: new google.maps.LatLng(lat, long),
        mapTypeId: google.maps.MapTypeId.ROADMAP
        };

    this.map =
        new google.maps.Map(document.getElementById('map'), this.mapOptions);
};

/*This function calls wikipedia to display links to current relavant articles. */

var CallWiki = function(wikiURL){
    var $wikiElem = $('#wikipedia-links');
// clear out old data before new request
    $wikiElem.text("");
// Wikipedia AJAX request goes here
    var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + wikiURL + '&format=json&callback=wikiCallback';
    var wikiRequestTimeout = setTimeout(function(){
        $wikiElem.text("failed to get wikipedia resources");
    }, 8000);

    $.ajax({
        url: wikiUrl,
        dataType: "jsonp",
        //jsonp: "callback",
        success: function( response ) {
            var articleList = response[1];

            for (var i =0; i < articleList.length; i++){
                articleStr = articleList[i];
                var url = 'http://en.wikipedia.org/wiki/' + articleStr;
                $wikiElem.append('<li><a href ="' + url + '">' + articleStr + '</a></li>');
            }
            clearTimeout(wikiRequestTimeout);
        }
    });
};

/**
 * This is the primary knockout view model
 */
var viewModel = function(){
    /* scope alias */
    var self = this;
    /* clear session storage any time we load */
    sessionStorage.clear();
    /* how many items to show in filtered list max? */
    /* sets based on window height to always fit a clean amount (min 1) */

    self.maxListNum = ko.observable(Math.max(1,Math.ceil(($(window).height() -150)/30)));

    //is the list visible right now? 1 = on, 0 = false;
    self.listVisible = ko.observable(1);
    /* which point is the first one on our list page right now?
     */
    self.listPoint = ko.observable(1);

    /* make sure the google map api loaded before we do any work */
    if (typeof google !== 'object' || typeof google.maps !== 'object'){
        console.log("error loading google maps api");
        $('#searchbox').val("Error Loading Google Maps Api");
        $('#searchbox').css({'background-color' : 'rgba(255,0,0,0.5)'});
        //return early since we have no maps.  No point in doing much else.
        return;
    }

    /* object to hold our map instance */
    self.theMap = new TheMap();
    window.map = self.theMap.map;
    /* counter for our zIndex so each marker is unique
     */
    self.zNum = 1;

    /* refit map after window resize? */
    self.refitResizeCheck = ko.observable(true);
    /* is the list visible? */
    self.listVisible = ko.observable(true);

    /**
     * sets our active point,
     * @param  {point object} point [point we are selecting]
     */
    self.selectPoint = function(point) {
        /* store the current point so we can still do things to it later */
        var oldPoint = self.currentPoint();

        /* if we find that the current window falls below 800pixels, remove the list
           if the windows size gets 800 pixels or larger, show the list again  */

        if ($(window).width() < 800) {
                self.toggleList(false);}
            else{
                self.toggleList(true);
            }

        self.currentPoint(point);

        /* call wikipedia routine*/
         CallWiki(self.currentPoint().wikiURL);

        /*increase z of selected point so it shows up on top of others */
//        point.marker.setZIndex(point.marker.getZIndex() + 5000);



        /* update icon */
        if (point.hovered() === true){
            point.hovered(false);
            self.mouseHere(point);
        }
        else{
            self.mouseGone(point);
        }
        /* reduce z of old point and make sure old icon also updates */
        if (oldPoint !== null && oldPoint !== undefined) {
            if (oldPoint.hovered() === true){
                oldPoint.hovered(false);
                self.mouseHere(oldPoint);
            }
            else{
                self.mouseGone(oldPoint);
            }
        }
    };

    /**
     * this is used for dynamic CSS class assignment to list items
     * based on status of things like mouse hover and point selection
     */
    self.getStyle = function(thisPoint){
        if (thisPoint === self.currentPoint()){
            if(thisPoint.hovered() === true) {
                //hovering over selected point
                return 'hoveredCurrentListPoint';
            }
            else {
                //point is selected but not hovered over
                return 'currentListPoint';
            }
        }
        else if (thisPoint.hovered() === true){
            //hovering over non selected point
            return 'hoveredListPoint';
        }
    };

    /**
     * This will be called when the mouse enters a point either on
     * it's marker or list item
     */
    self.mouseHere = function(point) {
        if (point.hovered() !== true) {
            point.hovered(true);
            if (point.marker.getZIndex() <= self.zNum) {
                point.marker.setZIndex(point.marker.getZIndex() + 5000);
            }
            if (self.currentPoint() === point) {
                point.marker.setIcon(point.activeHoverIcon);
            }
            else {
                point.marker.setIcon(point.hoverIcon);
            }
        }
    };

    /**
     * This will be called when the mouse leaves a point either on
     * it's marker or list item
     */
    self.mouseGone = function(point) {
        if (point.hovered() === true) {
            point.hovered(false);
        }
            if (point.marker.getZIndex() > self.zNum && point !==
                self.currentPoint()) {

                point.marker.setZIndex(point.marker.getZIndex() - 5000);
            }
            if (self.currentPoint() === point) {
                point.marker.setIcon(point.activeIcon);
            }
            else {
                point.marker.setIcon(point.defaultIcon);
            }

    };

    /**
     * This class it to create my array of locations(points)
     * These points include both map markers and details
     * current state information such as hovered over
     * name      [name of this location]
     * lat       [latitude]
     * long      [longitude]
     * wikiURL   [URL needed to get wikipedia information]
     * category  [category]
     */
    self.point = function(name, lat, long, wikiURL, category) {
        /* hover icon that turns the icon blue when hovered on using mouse */

        this.defaultIcon = 'https://mt.googleapis.com/vt/icon/name=icons/' +
        'spotlight/spotlight-poi.png';
        this.activeHoverIcon = 'https://mt.google.com/vt/icon?psize=20&font=' +
            'fonts/Roboto-Regular.ttf&color=ff330000&name=icons/spotlight/' +
            'spotlight-waypoint-a.png&ax=44&ay=48&scale=1&text=X';
        this.activeIcon = 'http://mt.google.com/vt/icon?psize=30&font=fonts/' +
            'arialuni_t.ttf&color=ff00ff00&name=icons/spotlight/spotlight' +
            '-waypoint-a.png&ax=43&ay=48&text=%E2%80%A2';
        this.hoverIcon = 'https://mt.google.com/vt/icon?color=ff004C13&name=' +
            'icons/spotlight/spotlight-waypoint-blue.png';
        /* name of this location */
        this.name = name;
        /* wiki URL of this location */
        this.wikiURL = wikiURL;
        /* latitiude and longitude for location */
        this.lat = lat;
        this.long = long;

        /* category used for both display and filtering */
        this.category = category;

        /* boolean for if we are currently hovering
         *over this point's list or marker
         */
        this.hovered = ko.observable(false);

        var draggable = false;
        /* the map marker for this point */
        this.marker = new google.maps.Marker({
            position: new google.maps.LatLng(lat, long),
            title: name,
            map: self.theMap.map,
            draggable: draggable,
            zIndex: self.zNum
        });

        /* make sure we tick up out zNum for each new point */
        self.zNum++;

        //this allows for selecting a point by clicking it's marker directly
        google.maps.event.addListener(this.marker, 'click', function() {
            self.selectPoint(this);
        }.bind(this));

        //mouse over event for this point's marker
        google.maps.event.addListener(this.marker, 'mouseover', function() {
            self.mouseHere(this);
        }.bind(this));

        //mouse out event for  this point's marker
        google.maps.event.addListener(this.marker, 'mouseout', function() {
            self.mouseGone(this);
        }.bind(this));
    };



    /* our point list */
    self.points = ko.observableArray([
        new self.point('City Museum', 38.6336,
            -90.2006, 'City_Museum', 'museum'),
        new self.point('Edward Jones Dome', 38.632912,
            -90.187706, 'Edward_Jones_Dome', 'Football'),
        new self.point('AT&T', 38.627524,
            -90.194651, 'AT%26T_Center_(St._Louis)', 'Technology Company'),
        new self.point('Scott Trade Center', 38.626840,
            -90.202678, 'Scottrade_Center', 'Hockey'),
        new self.point('Old Courthouse', 38.625674,
            -90.189274, 'Old_Courthouse_(St._Louis)', 'Meseum'),
        new self.point('Busch Stadium', 38.622644,
            -90.192813, 'Busch_Stadium', 'Baseball'),
    ]);

    /* the point we currently have clicked/selected, if any */
    self.currentPoint = ko.observable();

    /* filter from our search box.
     * changing it will recalc shownPoints computed array.
     */
    self.pointFilter = ko.observable('');

   /* calculated array containing just the filtered results from points()*/
    self.shownPoints = ko.computed(function() {
        return ko.utils.arrayFilter(self.points(), function(point) {
              return      (point.name.toLowerCase().indexOf(self.pointFilter().
                        toLowerCase()) !== -1 ||
                    point.category.toLowerCase().indexOf(self.pointFilter().
                        toLowerCase()) !== -1);
        });
    }, self);

    /* do some stuff if we change our shownPoints computed array */
    self.shownPoints.subscribe(function() {
        /* if we change which points are intended to be shown
         * also go ahead and apply that to the actual visual markers
         */
        self.toggleMarkers();

        /*  clears the wikipedia link section if a new filter entry has occured */
        var $wikiElem = $('#wikipedia-links');
        $wikiElem.text("");
    });

    /* just the items that should be visible on the list's
     * current visible page
     */

    self.shownList = ko.computed(function(){
        return self.shownPoints().slice(self.listPoint()-1,
        self.listPoint()-1 + self.maxListNum());
    });

/**
     * shows or hides the list.  Fired by clicks on our rollup icon/div.
     * this is done by setting listVisible which is used in the knockout
     * data binds as a boolean for the visible binding
     */
    self.toggleList = function(makeVisible){
        console.log(typeof makeVisible);
        /* check if we sent a visible argument and if not, make one
         * for some reason it feeds an object when it is left blank
         * so we have to check if it is a boolean instead of undefined
         */
        if (typeof makeVisible !== 'boolean') {
            if (self.listVisible() === 0) {
                makeVisible = true;
            }
            else {
                makeVisible = false;
            }
        }

        /* change actual list now that we know if we are hiding or showing */
        if(makeVisible === true){
            self.listVisible(1);
 //           self.rollupText('collapse list');
 //           self.rollupIconPath('img/collapseIcon.png');
        }
        else if (makeVisible === false){
            self.listVisible(0);
 //           self.rollupText('expand list');
 //           self.rollupIconPath('img/expandIcon.png');
        }

    };


    /**
     * run when shownPoints changes.  applies the visual intent of
     * that computed array to the actual map markers.  Markers are
     * hidden/shown and not actually removed since the list is static right now
     */
    self.toggleMarkers = function(){
        /* loop through all markers and make them hidden and unhovered
         * also ensure they have the right unhovered icon.  This is to
         * avoid hiding a hovered icon in it's hovered state
         */
        var i;
        var pointsLen = self.points().length;
        for (i = 0; i < pointsLen; i++) {
            var thisPoint = self.points()[i];
            thisPoint.marker.setVisible(false);
            thisPoint.hovered(false);
            /* set icons */
            if (self.currentPoint() === thisPoint) {
                thisPoint.marker.setIcon(thisPoint.activeIcon);
            }
            else {
                thisPoint.marker.setIcon(thisPoint.defaultIcon);
            }
        }
        /* now show all markers that we actually want shown. */

        var thisPointForLoop;
        for (i = 0; i < pointsLen; i++) {
            /* make sure the point is defined before messing with it */
        /* var thisPoint = self.shownPoints()[i]; */
            thisPointForLoop = self.shownPoints()[i];
            if (thisPointForLoop) {thisPoint.marker.setVisible(true);}
        }
    };

    /**
     * fit our map to show all of the currently visible markers at once
     * relies on google to do the actual zooming and panning here
     */
    self.refitMap = function() {
        //set bounds to a fresh viewpoints bounds so we start clean
        var bounds = new google.maps.LatLngBounds();

        //we don't want to try to zoom into a single point or no point
        //so make sure we are showing at least 2 before fitting the map
        var pointsLen = self.shownPoints().length;
        if(pointsLen >= 2) {
            for (var i = 0; i < pointsLen; i++) {
                // make the bounds big enough to fit this point
                bounds.extend (self.shownPoints()[i].marker.position);
            }
            // apply the new bounds to the map
            self.theMap.map.fitBounds(bounds);
        }
    };

    /* event to resize the map and list size when the browser window resizes */
    $(window).resize(function () {
        /* if we find that the current window falls below 800pixels, remove the list
           if the windows size gets 800 pixels or larger, show the list again  */
        if (self.refitResizeCheck()) {
            self.refitMap();
            if ($(window).width() < 800) {
                self.toggleList(false);}
            else{
                self.toggleList(true);
            }
        }
    });

    /* refit map once now that all of the points should be loaded */
    self.refitMap();

};

/**
 * This fires once the dom is loaded.  It applies the knockout view bindings from
 * the view model, which also puts into place all of the instantiations and
 * logic setup
 */
$(function(){
    ko.applyBindings(new viewModel());
});
