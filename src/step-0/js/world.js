window.onload = function () {
    var width, height, svg, path, years = [],
        colors, defColor, getColor,
        currentYear = "1993",
        playing = false,
        slider;

    function init() {
        setMap();
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
            '#006837'];
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
            .defer(d3.json, "../data/topoworld.json")  // карту в topoJSON формате
            .defer(d3.csv, "../data/freedom.csv")  // данные о свободе слова в cvs формате
            .await(processData);  // обработка загруженных данных
    }

    function addLegend() {
        var lw = 200, lh = 10,  // legend width, height
            lpad = 10,  // legend padding
            lcw = lw / 10;  // legend category width

        var legend = svg.append("g")
            .attr(
                "transform","translate(" + (width+(lpad-width)) + "," + (height-(lh+lpad)) + ")");

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

    function addSlider() {
        // Add year indicator
        svg.append("text")
            .attr("id", "year")
            .attr("transform", "translate(409,550)")
            .text(currentYear);
        // Add slider button
        var btn = svg.append("g").attr("class", "button").attr("id", "play")
            .attr("transform", "translate(225,565)")
            .attr("onmouseup", animateMap);
        btn.append("rect")
            .attr("x", 20).attr("y", 1)
            .attr("rx", 5).attr("ry", 5)
            .attr("width", 39)
            .attr("height", 20)
            .style("fill", "#234c75");
        btn.append("text")
            .attr("x", 25)
            .attr("y", 16)
            .style("fill", "white")
            .text("Play");
        
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
            .attr("width", 300)
            .attr("id", "slider")
            .attr("transform", "translate(273,545)");
        // Render the slider in the div
        d3.select('#slider').call(slider);
        var dragBehaviour = d3.behavior.drag();
        
        dragBehaviour.on("drag", function(d){
            var pos = d3.event.x;
            slider.move(pos+25);
            currentYear = slider.value();
            sequenceMap();
            d3.select("#year").text(currentYear);
        });

        svg.selectAll(".dragger").call(dragBehaviour);
    }

    function processData(error, worldMap, countryData) {
        // получение GeoJSON из TopoJSON (TopoJSON -> GeoJSON)
        var world = topojson.feature(worldMap, worldMap.objects.world);
        var countries = world.features;
        
        for (var i in countries) {
            for (var j in countryData) {
                if (countries[i].id == countryData[j].ISO3166) {
                    for(var k in countryData[j]) {
                        if (k != 'Country' && k != 'ISO3166') {
                            if (years.indexOf(k) == -1) { 
                                years.push(k);
                            }
                            countries[i].properties[k] = Number(countryData[j][k])
                        }
                    }
                    break;
                }
            }
        }
        d3.select("#year").text(currentYear);
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

        sequenceMap();

        addLegend();
        addSlider();
    }

    function animateMap() {
        var timer;
        d3.select('#play').on('click', function() {
            if (playing == false) {
                timer = setInterval(function() {
                    if (currentYear < years[years.length-1]) {
                        currentYear = (parseInt(currentYear) + 1).toString()
                    } else {
                        currentYear = years[0];
                    }
                    sequenceMap();
                    slider.setValue(currentYear);
                    d3.select("#year").text(currentYear);
                }, 1000);
            
                d3.select(this).select('text').text('Stop');
                playing = true;
            } else {
                clearInterval(timer);
                d3.select(this).select('text').text('Play');
                playing = false;
            }
        });
    }

    function sequenceMap() {
        d3.selectAll('.country')
            .style('fill', function(d) {
                color = getColor(d.properties[currentYear]);
                return color ? color : defColor;
            });
    }

    init();
};
