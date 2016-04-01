window.onload = function () {
    var width, height, svg, path;

    function init() {
        setMap();
    }

    function setMap() {
        width = 818, height = 600;

        svg = d3.select('#map').append('svg')
            .attr('width', width)
            .attr('height', height);

        var miller = d3.geo.miller()
          .scale(130)
          .translate([width / 2, height / 2])
          .precision(.1);

        path = d3.geo.path().projection(miller);

        loadData();
    }

    function loadData() {
        queue()
          .defer(d3.json, "../data/topoworld.json")
          .defer(d3.csv, "../data/freedom.csv")
          .await(processData);
    }

    function processData(error, worldMap, countryData) {
        var world = topojson.feature(worldMap, worldMap.objects.world);
        drawMap(world);
    }

    function drawMap(world) {
        var map = svg.append("g");
        map.selectAll(".country")
          .data(world.features)
              .enter().append("path")
          .attr("class", "country")
          .attr("d", path);
    }

    init();
};
