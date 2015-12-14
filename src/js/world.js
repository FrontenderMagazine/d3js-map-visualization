window.onload = function () {

    var svg, colorSet, path, attributeArray = [],
        currentAttribute = 0,
        playing = false;

    function init() {
        setMap();
        animateMap();
    }

    function setMap() {
        var width = 600,
            height = 600;

        svg = d3.select('#map').append('svg')
            .attr('width', width)
            .attr('height', height);

        colorSet = [
            '#d53e4f',
            '#fc8d59',
            '#fee08b',
            '#ffffbf',
            '#e6f598',
            '#99d594',
            '#3288bd'
        ];

        // получение GeoJSON из TopoJSON (TopoJSON -> GeoJSON)
        // var world = topojson.feature(worldmap, worldmap.objects.world);
        
        /* Заготовки различных проекций */
        // Получаем определение одной из проекций
        var mercator = d3.geo.mercator()
                        .scale(90)
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
        
        // Определяем генератор пути (path) по конкретной проекции
        path = d3.geo.path().projection(mercator);
        
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
        svg.selectAll(".country")
            .data(world.features)
            .enter().append("path")
            .attr("class", "country")
            .attr("id", function(d) {
                return "code_" + d.id; }, true)
            .attr("d", path);

        var dataRange = getDataRange();
        d3.selectAll('.country')
            .style('fill', function(d) {
                return getColor(d.properties[attributeArray[currentAttribute]], dataRange);
            });
    }

    function getDataRange() {
        return [0,100];
    }

    function getColor(valueIn, valuesIn) {
        // var color = d3.scale.linear()
        //     .domain([valuesIn[0],valuesIn[1]])
        //     .range([.3,1]);

        var color = d3.scale.linear()
            .domain([valuesIn[1], valuesIn[0]])
            .range(['#9e0142', '#abdda4']);

        if (valuesIn[1] >= valueIn >= valuesIn[0] && Number.isInteger(valueIn)) {
            return color(valueIn);
        } else {
            return "#a0b5bb";
        }
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
        var dataRange = getDataRange();
        d3.selectAll('.country').transition()
            .duration(0)
            .style('fill', function(d) {
                return getColor(d.properties[attributeArray[currentAttribute]], dataRange);
            });
    }

    init();
};