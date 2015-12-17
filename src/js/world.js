window.onload = function () {
    var width, height, svg, path, attributeArray = [],
        colors, defColor, getColor,
        currentAttribute = 0,
        playing = false;

    function init() {
        setMap();
        animateMap();
    }

    function setMap() {
        width = 818, height = 600;

        svg = d3.select('#map').append('svg')
            .attr('width', width)
            .attr('height', height);

        // colors = [ // theguardian
        //     "#ca2345",
        //     "#ed3d61",
        //     "#f58680",
        //     "#fdd09e",
        //     "#daeac1",
        //     "#8ac7cd",
        //     "#39a4d8"];
        // colors = [
        //     '#990000',
        //     '#d7301f',
        //     '#ef6548',
        //     '#fc8d59',
        //     '#fdbb84',
        //     '#fdd49e',
        //     '#fef0d9',
        //     ];
        colors = [
            '#a50026',
            '#d73027',
            '#f46d43',
            '#fdae61',
            '#fee08b',
            '#d9ef8b',
            '#a6d96a',
            '#66bd63',
            '#1a9850',
            '#006837',
        ];
        // defColor = '#a0b5bb';
        defColor = "grey";

        getColor = d3.scale.quantize().domain([100,0]).range(colors);

        // получение GeoJSON из TopoJSON (TopoJSON -> GeoJSON)
        // var world = topojson.feature(worldmap, worldmap.objects.world);
        
        /* Заготовки различных проекций */
        // Получаем определение одной из проекций
        var mercator = d3.geo.mercator()
                        .scale(95)
                        .translate([width / 2, height / 2]);
        // Получаем определение одной из проекций
        var orthographic = d3.geo.orthographic()
                            .scale(275)
                            .translate([width / 2, height / 2])
                            .clipAngle(90)
                            .precision(.1);
        // Получаем определение одной из проекций
        var albers = d3.geo.albers()
                          .center([0, 55.4])
                          .rotate([4.4, 0])
                          .parallels([50, 60])
                          .scale(100)
                          .translate([width / 2, height / 2]);
        // Получаем определение одной из проекций
        var miller = d3.geo.miller()
                        .scale(130)
                        .translate([width / 2, height / 2])
                        .precision(.1);
        
        // Определяем генератор пути (path) по конкретной проекции
        path = d3.geo.path().projection(miller);
        
        /* Отрисовка контура всего мира */
        // svg.append("path")
        //   .datum(world)  // Передаем GeoJSON
        //   .attr("class", "world")
        //   .style("fill", "white")
        //   .attr("d", path);  // Устанавливаем в атрибут "d" сгенерированные данные

        // /* Отрисовка каждой страны отдельно */
        // svg.selectAll(".country")
        //     .data(world.features)
        //   .enter().append("path")
        //     .attr("class", "country")
        //     // .attr("class", function(d) { return "subunit " + d.id; })
        //     .style("fill", function(d) {
        //         return colors[getRandomIntInclusive(0, 4)];
        //     })
        //     .attr("d", path);

        loadData();
    }

    function loadData() {
        queue()
            .defer(d3.json, "topoworld.json")  // карту в topoJSON формате
            .defer(d3.csv, "data/freedom.csv")  // данные о свободе слова в cvs формате
            .await(processData);  // обработка загруженных данных
    }

    function addLegend() {
        var lw = 200, lh = 10,  // legend width, height
            lpad = 10,  // legend padding
            lcw = lw / 10;  // legend category width

        var legend = svg.append("g")
            .attr("transform", "translate(" + (width+(lpad-width)) + "," + (height-(lh+lpad)) + ")");

        legend.append("rect")
            .attr("width", lw)
            .attr("height", lh)
            .style("fill", "white");

        var lcolors = legend.append("g")
            .style("fill", defColor);

        for (i = 0; i < 10; i++) { 
            lcolors.append("rect")
                .attr("height", 10)
                .attr("width", lcw)
                .attr("x", i * lcw)
                .style("fill", colors[i]);
        }
    }

    function processData(error, worldmap, countryData) {
        world = topojson.feature(worldmap, worldmap.objects.world)
        var countries = world.features;
        
        for (var i in countries) {
            for (var j in countryData) {
                if (countries[i].id == countryData[j].ISO3166) {
                    for(var k in countryData[j]) {
                        if (k != 'Country' && k != 'ISO3166') {
                            if(attributeArray.indexOf(k) == -1) { 
                                attributeArray.push(k);
                            }
                            countries[i].properties[k] = Number(countryData[j][k])
                        }
                    }
                    break;
                }
            }
        }
        d3.select('#clock').html(attributeArray[currentAttribute]);
        drawMap(world);
    }

    function drawMap(world) {
        var map = svg.append("g");
        map.selectAll(".country")
            .data(world.features)
            .enter().append("path")
            .attr("class", "country")
            .attr("id", function(d) {
                return "code_" + d.id; }, true)
            .attr("d", path);

        d3.selectAll('.country')
            .style('fill', function(d) {
                color = getColor(d.properties[attributeArray[currentAttribute]]);
                return color ? color : defColor;
            });

        addLegend();
    }

    function animateMap() {
        var timer;
        d3.select('#play').on('click', function() {
            if (playing == false) {
                timer = setInterval(function() {
                    if (currentAttribute < attributeArray.length - 1) {
                        currentAttribute +=1;
                    } else {
                        currentAttribute = 0;
                    }
                    sequenceMap();
                    d3.select('#clock').html(attributeArray[currentAttribute]);
                }, 1000);
            
                d3.select(this).html('stop');
                playing = true;
            } else {
                clearInterval(timer);
                d3.select(this).html('play');
                playing = false;
            }
        });
    }

    function sequenceMap() {
        d3.selectAll('.country').transition()
            .duration(0)
            .style('fill', function(d) {
                color = getColor(d.properties[attributeArray[currentAttribute]]);
                return color ? color : defColor;
            });
    }

    init();
};