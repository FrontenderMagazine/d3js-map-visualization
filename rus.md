# Визуализация гео-данных в d3.js


## Что такое d3.js?

Для тех кто не слышал про d3.js, напонмню, что это библиотека, имеющая широкий
спектр преминения  обладающая большой гибкостью в области визуализации данных.


## Зависимости

<!-- Для тех у кого чистая система -->
sudo aptitude install npm
sudo aptitude install gdal-bin
sudo npm install -g topojson
which ogr2ogr
which topojson
<!-- This should print /usr/local/bin/ogr2ogr and /usr/local/bin/topojson. -->
<!-- Проблемы с установкой node.js -->
For linux distributions which install package binaries to /usr/bin you can do:
ln -s /usr/bin/nodejs /usr/bin/node
<!-- Converrting data -->
ogr2ogr -f GeoJSON -where "ADM0_A3 IN ('UKR')" subunits.json ne_10m_admin_0_map_subunits/ne_10m_admin_0_map_subunits.shp
ogr2ogr -f GeoJSON -where "ISO_A2 = 'UA' AND SCALERANK < 8" places.json ne_10m_populated_places/ne_10m_populated_places.shp
<!-- topojson -o ukr.json --id-property SU_A3 --properties name=NAME subunits.json places.json -->
topojson -o ukr.json --id-property SU_A3 --properties name=NAME_1 subunits.json places1.json


## Где взять данные о картах?

Карты:
* Основной источник:
  http://www.naturalearthdata.com/downloads/ (вся карта мира, с частичными регионами и областями)
* Альтернатива:
  * http://gadm.org/country (с регионами областями)
  * http://openlayers.org/

Данные в нормальном виде:
    https://freedomhouse.org/report-types/freedom-press
Здесь красиво, подсмотрел кое что для себя:
    https://rsf.org/index2014/en-index2014.php
    http://ec.europa.eu/eurostat/web/regions/statistics-illustrated


## Конвертация данных

Процесс конвертации данных схематично выглядит вот так:
shapefiles -> GeoJSON -> TopoJSON

Выбор всей карты мира с внутренними областями стран
* Загружаем Admin 0 – Countries (http://www.naturalearthdata.com/downloads/10m-cultural-vectors/) и распаковываем
* Конвертируем shapefiles данные в GeoJSON:
  ogr2ogr -f GeoJSON world.json ne_10m_admin_0_countries/ne_10m_admin_0_countries.shp
* Конвертируем GeoJSON в TopoJSON
  topojson -o topoworld.json --id-property SU_A3 world.json

Как по мне, тема работы с утилитами ogr2ogr и topojson достойна отдельной статьи, но ниже я приведу несколько вариантов их использования:
*
*
*

## Загрузка данных
    d3.json("topoworld.json", function(error, worldmap) {
      // получение GeoJSON из TopoJSON (TopoJSON -> GeoJSON)
      var world = topojson.feature(worldmap, worldmap.objects.world);
    });


## Создание svg объекта
    var width = 960,
        height = 1160;

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);


## Для рендеринга карты необходимо еще 2 вещи:
* projection
  Здесь примеры определения несколько видов проекций

    var mercator = d3.geo.mercator()
                    .scale(75)
                    .translate([width / 2, height / 2]);
    var orthographic = d3.geo.orthographic()
                        .scale(275)
                        .translate([width / 2, height / 2])
                        .clipAngle(90)
                        .precision(.1);
    var albers = d3.geo.albers()
                      .center([0, 55.4])
                      .rotate([4.4, 0])
                      .parallels([50, 60])
                      .scale(100)
                      .translate([width / 2, height / 2]);
* path generator
  Для генератора пути задается определенная проекция

    var path = d3.geo.path().projection(mercator);


## Рендеринг карты
Объект 
Рендеринг карты можно осуществить несколькими способами:
* Рендерин всей карты сразу. В этом случае передаем целый GeoJSON.
    svg.append("path")
        .datum(world)  // Передаем GeoJSON
        .attr("class", "world")
        .style("fill", "white")
        .attr("d", path);  // Устанавливаем в атрибут "d" сгенерированные данные

* Рендерин карты по одной стране
  Этот случай предусматривает манипуляцию с каждым отдельно взятым полигоном страны.
    svg.selectAll(".country")
        .data(world.features)
      .enter().append("path")
        .attr("class", "country")
        .attr("d", path);


## Добавление цвета
http://colorbrewer2.org/


## Links

http://bost.ocks.org/mike/map/