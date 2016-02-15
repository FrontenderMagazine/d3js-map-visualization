window.onload = function () {
    var width, height, svg, path, attributeArray = [],
        colors, defColor, getColor,
        currentAttribute = 0,
        currentYear = 1993,
        playing = false,
        slider;

    function init() {
        setMap();
        animateMap();
    }

    function setMap() {
        width = 818, height = 600;

        svg = d3.select('#map').append('svg')
            .attr('width', width)
            .attr('height', height);

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
        defColor = "white";

        getColor = d3.scale.quantize().domain([100,0]).range(colors);

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

        loadData();
    }

    function loadData() {
        queue()
            .defer(d3.json, "data/topoworld.json")  // карту в topoJSON формате
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

        // Initialize slider
        var formatter = d3.format("04d");
        var tickFormatter = function(d) {
            return formatter(d);
        }

        slider = d3.slider().min('1993').max('2014')
            .tickValues(['1993','2000','2007','2014'])
            .stepValues(d3.range(1993,2015))
            .tickFormat(tickFormatter);

        svg.append("g")
            .attr("height", 10)
            .attr("width", 300)
            .attr("id", "slider")
            .attr("transform", "translate(" + (lpad + lw) + "," + (height - (5.5 * lpad)) + ")");
            // .attr("transform", "translate(" + (lpad + lw) + "," + (height) + ")");
        // Render the slider in the div
        d3.select('#slider').call(slider);
        var dragBehaviour = d3.behavior.drag();
        dragBehaviour.on("drag", function(d){
            var pos = d3.event.x;
            slider.move(pos+25);
            currentYear = slider.value();
            sequenceMapByYear();
            currentAttribute = attributeArray.indexOf(currentYear.toString());
            d3.select('#clock').html(attributeArray[currentAttribute]);
        });
        svg.selectAll(".dragger").call(dragBehaviour);
    }

    function processData(error, worldmap, countryData) {
        // получение GeoJSON из TopoJSON (TopoJSON -> GeoJSON)
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
                    slider.setValue(attributeArray[currentAttribute]);
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

    function sequenceMapByYear() {
        d3.selectAll('.country').transition()
            .duration(0)
            .style('fill', function(d) {
                color = getColor(d.properties[currentYear]);
                return color ? color : defColor;
            });
    }

    init();
};
