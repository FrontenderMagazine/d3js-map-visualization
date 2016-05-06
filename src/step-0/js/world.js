window.onload = function () {
    var width, height, svg, path,
        years = [],
        colors, defColor, getColor,
        currentYear = "1993",
        playing = false,
        slider,
        margin = {top: 40, right: 15, bottom: 20, left: 40},  // for chart
        chartWidth = 150,
        chartHeight = 50,
        tooltip, tooltipText, chartAreaPath, chartArea, chartLinePath, chartLine;

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

    function addLegend() {
        var lw = 200, lh = 10,  // legend width, height
            lpad = 10,  // legend padding
            lcw = lw / 10;  // legend category width

        var legend = svg.append("g")
            .attr(
                "transform",
                "translate(" + (width+(lpad-width)) + "," + (height-(lh+lpad)) + ")");

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
            .attr("transform", "translate(270,568)")
            .attr("onmouseup", animateMap);
        var playBtn = btn.append("g")
            .attr("class", "play")
            .attr("display", "inline");
        playBtn.append("path")
            .attr("d", "M0 0 L0 16 L12 8 Z")
            .style("fill", "#234c75");
        var stopBtn = btn.append("g")
            .attr("class", "stop")
            .attr("display", "none");
        stopBtn.append("path")
            .attr("d", "m 0,0 0,16")
            .attr("stroke", "#234c75")
            .attr("stroke-width", 6);
        stopBtn.append("path")
            .attr("d", "m 8,0 0,16")
            .attr("stroke", "#234c75")
            .attr("stroke-width", 6);
        
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

    function addToolTip() {
        // Axis
        var chartX = d3.time.scale()
            .domain([1993, 2014])
            .range([0, chartWidth]);
        var chartY = d3.scale.linear()
            .domain([0, 100])
            .range([chartHeight, 0]);
        var chartXAxis = d3.svg.axis()
            .scale(chartX)
            .orient("bottom")
            .tickValues(chartX.domain())
            .tickFormat(d3.format(".0f"));
        var chartYAxis = d3.svg.axis()
            .scale(chartY)
            .orient("left")
            .tickValues(chartY.domain())
            .tickFormat(function(d) { return d + "%"; });

        // Chart elements
        chartLine = d3.svg.line()
            .defined(function(d) { return d[1]; })
            .x(function(d) { return chartX(d[0]); })
            .y(function(d) { return chartY(d[1]); });
        chartArea = d3.svg.area()
            .defined(chartLine.defined())
            .x(chartLine.x())
            .y0(chartHeight)
            .y1(chartLine.y());

        // Create tooltip
        tooltip = svg.append("g")
            .attr("transform", "translate(" + -1000 + "," + -1000 + ")")
            .attr("class", "tooltipchart");
        // Create tooltip space
        tooltip.append("rect")
            .attr("width", chartWidth + margin.left + margin.right)
            .attr("height", chartHeight + margin.top + margin.bottom);
        // Create tooltip text (for country name)
        tooltipText = tooltip
            .append("text")
            .attr("class", "text")
            .attr("x", 15)
            .attr("y", 25);

        // Create chart space
        var chart = tooltip.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        // Add chart elements
        chartAreaPath = chart.append("path").attr("class", "area");
        chartLinePath = chart.append("path").attr("class", "line");
        // Add chart axis
        chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + chartHeight + ")")
            .call(chartXAxis);
        chart.append("g")
            .attr("class", "y axis")
            .call(chartYAxis);
    }

    function processData(error, worldMap, countryData) {
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
                    countries[i].country = countryData[j].Country;
                    break;
                }
            }
        }

        drawMap(world);
    }

    function drawMap(world) {
        var delta = 10,
            tooltipWidth = margin.left + chartWidth + margin.right,
            tooltipHeight = margin.top + chartHeight + margin.bottom;
        var map = svg.append("g");
        map.selectAll(".country")
            .data(world.features)
                .enter().append("path")
            .attr("class", "country")
            .attr("d", path)
            .on("mousemove", function(d) {
                if (Object.keys(d.properties).length != 0) {
                    var xy = d3.mouse(this)
                        x = (xy[0] + delta),
                        y = (xy[1] - delta - tooltipHeight);
                    if (width - xy[0] < tooltipWidth) {
                        x = xy[0] - tooltipWidth - delta;
                    }
                    if (xy[1] < tooltipHeight) {
                        y = xy[1] + delta;
                    }
                    tooltip.attr("transform", "translate(" + x + "," + y + ")");
                }
            })
            .on("mouseout", function(d) {
                tooltip
                    .attr("transform", "translate(" + (-1000) + "," + (-1000) + ")");
                d3.select(this)
                    .style("stroke-width", 0.1);
            })
            .on("mouseover", function(d) {
                d3.select(this)
                    .style("stroke-width", 1.5);
                updateTooltipText(d.country);
                updateTooltipChart(d.properties);
            });

        sequenceMap();

        addLegend();
        addSlider();
        addToolTip();
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
            
                d3.select(this).select('.play').attr('display', 'none');
                d3.select(this).select('.stop').attr('display', 'inline');
                playing = true;
            } else {
                clearInterval(timer);
                d3.select(this).select('.play').attr('display', 'inline');
                d3.select(this).select('.stop').attr('display', 'none');
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

    function updateTooltipText(text) {
        tooltipText.text(text);
    }

    function updateTooltipChart(data) {
        var dur = 500,
            data = dictToList(data);
        chartAreaPath
            .datum(data)
                .transition().duration(dur)
            .attr("d", chartArea);
        chartLinePath
            .datum(data)
                .transition().duration(dur)
            .attr("d", chartLine);
    }

    init();
};


function dictToList(dict) {
    var list = [];
    for(var i in dict) {
        list.push([i, dict[i]]);
    }
    return list;
}
