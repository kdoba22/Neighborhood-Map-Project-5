## Neighborhood Map portfolio project

   Neighborhood of interest is the downtown St. Louis area around the AT&T building.

To Run the Project:
  1.  Right click on index.html and select open with Google Chrome.
  2.  Once running, click on any of the map markers or list items to bring up a list of Wikededia links to current articles about the choses point of interest.
  3.  type into the filter text box to filter the shown points of interests.
  4.  To open a wikipedia link, right click on the link and select 'open in new tab'.


NOTES:

I referenced possible hundreds of web pages to complete this assignment.
The most useful to me were http://knockoutjs.com/ and many articles fromt the Google Developer community.

The points were chosen at random from a list of places that I frequent.

Code to refit map to window modified from code found at, http://grapsus.net/blog/post/Google-API-v3-fit-map-zoom-and-bounds-to-all-markers
Much of the filter syntax came from http://www.knockmeout.net/2011/04/utility-functions-in-knockoutjs.html

In the Google Maps routines:
google.maps.event.addListener(this.marker, 'click', function() {
    self.selectPoint(this);
}.bind(this));

The observable array for the collection syntax came from http://knockoutjs.com/examples/collections.html
