(function( Popcorn ) {

var dates = [1820, 1830, 1840, 1850, 1860, 1870, 1880, 1890, 1900, 1910, 1920, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2011];

function stream_layers(n, m, o) {

  if (arguments.length < 3) o = 0;
  function bump(a) {
    var x = 1 / (.1 + Math.random()),
        y = 2 * Math.random() - .5,
        z = 10 / (.1 + Math.random());
    for (var i = 0; i < m; i++) {
      var w = (i / m - y) * z;
      a[i] += x * Math.exp(-w * w);
    }
  }
  return d3.range(n).map(function() {
      var a = [], i;
      for (i = 0; i < m; i++) a[i] = o + o * Math.random();
      for (i = 0; i < 5; i++) bump(a);
      return a.map(stream_index);
    });
}

function stream_waves(n, m) {
  return d3.range(n).map(function(i) {
    return d3.range(m).map(function(j) {
        var x = 20 * j / m - i / 3;
        return 2 * x * Math.exp(-.5 * x);
      }).map(stream_index);
    });
}

function stream_index(d, i) {
  return {x: i, y: Math.max(0, d)};
}


function transitionGroup() {
  var group = d3.selectAll("#wave");

  group.select("#group")
      .attr("class", "first active");

  group.select("#stack")
      .attr("class", "last");

  group.selectAll("g.layer rect")
    .transition()
      .duration(500)
      .delay(function(d, i) { return (i % m) * 10; })
      .attr("x", function(d, i) { return x({x: .9 * ~~(i / m) / n}); })
      .attr("width", x({x: .9 / n}))
      .each("end", transitionEnd);

  function transitionEnd() {
    d3.select(this)
      .transition()
        .duration(500)
        .attr("y", function(d) { return height - y2(d); })
        .attr("height", y2);
  }
}

function transitionStack() {
  var stack = d3.select("#wave");

  stack.select("#group")
      .attr("class", "first");

  stack.select("#stack")
      .attr("class", "last active");

  stack.selectAll("g.layer rect")
    .transition()
      .duration(500)
      .delay(function(d, i) { return (i % m) * 10; })
      .attr("y", y1)
      .attr("height", function(d) { return y0(d) - y1(d); })
      .each("end", transitionEnd);

  function transitionEnd() {
    d3.select(this)
      .transition()
        .duration(500)
        .attr("x", 0)
        .attr("width", x({x: .9}));
  }
}

  Popcorn.plugin( "hothack", {
    _setup: function( options ) {

    },

    start: function( event, options ) {
    
      //var dates = dates2.slice(0);
    

      // clear any existing content
      document.getElementById( options.target ).innerHTML = "";
      document.getElementById( "content" ).innerHTML = "";
      
      if ( options.pause || options.image || options.text ) {
      
        this.pause();
        if ( options.content ) {
        
          var image = document.createElement( "img" );
          image.src = options.image;
          document.getElementById( options.content ).appendChild( image );
        
          var div = document.createElement( "div" );
          div.innerHTML = options.text;
          document.getElementById( options.content ).appendChild( div );
          
        }
      }
      //options.pause && this.pause();
      //console.log( this );
      
      var n = 1, // number of layers
          m = options.m, // number of samples per layer
          data = d3.layout.stack()(stream_layers(n, m, .1)),
          color = d3.interpolateRgb("#aad", "#556");

data = [options.data];
      var margin = 20,
          width = 960,
          height = 500 - .5 - margin,
          mx = m,
          my = d3.max(data, function(d) {
            return d3.max(d, function(d) {
              return d.y0 + d.y;
            });
          }),
          mz = d3.max(data, function(d) {
            return d3.max(d, function(d) {
              return d.y;
            });
          }),
          x = function(d) { return d.x * width / mx; },
          y0 = function(d) { return height - d.y0 * height / my; },
          y1 = function(d) { return height - (d.y + d.y0) * height / my; },
          y3 = function(d) { return d.y; },
          y2 = function(d) { return d.y * height / mz; }; // or `my` to not rescale

      var vis = d3.select("#" + options.target)
        .append("svg")
          .attr("width", width)
          .attr("height", height + margin);

      var layers = vis.selectAll("g.layer")
          .data(data)
        .enter().append("g")
          .style("fill", function(d, i) { return color(i / (n - 1)); })
          .attr("class", "layer");

      var bars = layers.selectAll("g.bar")
          .data(function(d) { return d; })
          .enter().append("g")
          .attr("class", "bar")
          .attr("transform", function(d) { return "translate(" + x(d) + ",0)"; });
          
      bars.append("rect")
          .attr("width", x({x: .9}))
          .attr("x", 0)
          .attr("y", height)
          .attr("height", 0)
        //.transition()
          //.delay(function(d, i) { return i * 10; })
          .attr("y", y1)
          .attr("fill", "#00F")
          //.attr("style", "color: -moz-linear-gradient(top, #55aaee, #003366)" )//background: -moz-linear-gradient(top, #55aaee, #003366)
          .attr("height", function(d) { return y0(d) - y1(d); });

      bars.append("text")
          //.attr("width", x({x: .9}))
          //.attr("x", 0)
          .attr("y", y1)
          //.attr("text-anchor", "middle")
          //.attr("height", 0)
          .text(y3);

      var labels = vis.selectAll("text.label")
          .data(data[0])
        .enter().append("text")
          .attr("class", "label")
          .attr("x", x)
          .attr("y", height + 6)
          .attr("dx", x({x: .45}))
          .attr("dy", ".71em")
          .attr("text-anchor", "middle")
          .text(function(d, i) { return dates[i]; });
          //.text(function(d, i) { return i; });

      vis.append("line")
          .attr("x1", 0)
          .attr("x2", width - x({x: .1}))
          .attr("y1", height)
          .attr("y2", height);


    
    },

    end: function( event, options ) {

    },
    _teardown: function( options ) {

    }
  });
})( Popcorn );
