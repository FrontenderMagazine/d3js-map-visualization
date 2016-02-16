# Визуализация гео-данных в d3.js


## Что такое d3.js?

Для тех кто не слышал про d3.js, напонмню, что это библиотека, имеющая широкий
спектр преминения обладающая большой гибкостью в области визуализации данных.

В этой статье я хотел бы пошагово разьяснить как сделать простую визуализацию на географической карте использую связку d3.js и TopoJSON. Будут затронуты вопросы конвертации данных и их последующая загрузка, элементы стилизаци карты и интерактивность.
Чтобы Вас заинетерсовать, покажу карту сразу:

[step-final.html][1]

На карте изображено в градация свободы прессы по странам и годам. Визуализация довольно проста, но поможет понять и освоить основные приемы работы с картами в d3.js.


## Где взять данные о картах?

Как мы знаем карта представляет из себя контуры, линии, границы государств, береговые линии и много другой геометрии. Для получения этой геометрии мы будем обращаться к shapefile формату, популярному формату географических файлов. Shapefile позволяет хранить точки, линии, полигоны и другие объекты. Также может содержать параметры типа температура, название, грубина и т.д. Hа самом деле shapefile представляет из себя набер из трех файлов *.shp, *.shx и *.dbf. Важно, чтобы эти три файла были расположены в одной директории.
В сети существует множество источников shapefile данных, но для меня самым подходящим, понятным и удобным источником оказался ресурс [Natural Earth][2]. Он содержит карты территорий государств с границами (что нам и понадобиться), физические и даже растровые изображения поверхности планеты.
В качестве альтернативы можно рассмотреть [Global Administrative Areas][3] и [OpenLayers3][4].
Мы будем использовать контурную [карту][5] масштаба 1:110 метров.


## Зависимости

Нам понадобится несколько утилит для обработки и конвертации гео-данных:
* [ogr2ogr][6]
* [TopoJSON][7]

Для topojson нам понадобится nodejs, к счастью он есть собраный пакет в репозитории.
`$ sudo apt-get install nodejs`
`$ sudo apt-get install npm`

Далее устанавливаем TopoJSON:
`$ sudo npm install -g topojson`
Если установка бинарного пакета nodejs, то при установке возможна проблема в духе:
`/usr/bin/env: node: No such file or directory`
Для устранения достаточно прописать ссылку на nodejs:
`$ ln -s /usr/bin/nodejs /usr/bin/node`

Для установки ogr2ogr достаточно установить [Geospatial Data Abstraction Library][8] (GDAL), которая включает в себя нужную нам утилиту:
`$ sudo apt-get install gdal-bin`
Если Вы пользователь Mac, то установка происходит через brew:
`$ brew install gdal`


## Конвертация данных

Сейчас наша задача состоит в том, чтобы получить из shapefiles конечный TopoJSON файл. Для этого нам понадобиться сгенерировать промежуточный GeoJSON файл. На этапе генерации GeoJSON файла мы получаем возможность отфильтровать лишние, не нужные нам данный из shapefiles и что немаловажно привести значение координат к меньшему числу знаков после запятой, что критично в борьбе за скорость рендеринга, да и просто соращает размер файла примерно на 85%.

В конечном итоге, процесс конвертации данных схематично выглядит так:
shapefiles -> GeoJSON -> TopoJSON

И так, приступим к конвертации. Нам нужно получить TopoJSON со странами мира.
1. Загрузка и распаковка архива
  На сайте [Natural Earth][2] в разделе "Downloads" выбираем "1:110m Cultural Vectors", в представленном списке выбираем раздел "Admin 0 – Countries" и жмём "Download countries". Очень советую зайти и посмотреть что вообще предлагается и какие форматы.
2. Конвертируем shapefiles данные в GeoJSON
  `$ ogr2ogr -f GeoJSON world.json ne_10m_admin_0_countries/ne_10m_admin_0_countries.shp`
  world.json - имя файла который будет создан по результату генерации.
3. Конвертируем GeoJSON в TopoJSON
  `$ topojson -o topoworld.json --id-property SU_A3 world.json`
  topoworld.json - результирующий TopoJSON файл.

Как по мне, тема работы с утилитами ogr2ogr и topojson достойна отдельной статьи. Поиграйтесь с различными фильтрами, например, отдельно Украину с границами областей можно получить написав что-то в духе:
`$ ogr2ogr -f GeoJSON -where "ADM0_A3 IN ('UKR')" ukraine.json ne_10m_admin_0_map_subunits/ne_10m_admin_0_map_subunits.shp`
`$ ogr2ogr -f GeoJSON -where "ISO_A2 = 'UA' AND SCALERANK < 8" ukr_obls.json ne_10m_populated_places/ne_10m_populated_places.shp`
`$ topojson -o ukr.json --id-property SU_A3 --properties name=NAME ukraine.json ukr_obls.json`


## Загрузка данных

    d3.json("topoworld.json", function(error, worldmap) {
      // получение GeoJSON из TopoJSON (TopoJSON -> GeoJSON)
      var world = topojson.feature(worldmap, worldmap.objects.world);
    });


## Отображение карты

    var width = 960,
        height = 1160;

    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);

Для рендеринга карты необходимо еще 2 вещи:
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

Рендеринг карты можно осуществить несколькими способами:
* Рендерин всей карты сразу. В этом случае передаем целый GeoJSON.
    svg.append("path")
        .datum(world)  // Передаем GeoJSON
        .attr("class", "world")
        .style("fill", "white")
        .attr("d", path);  // Устанавливаем в атрибут "d" сгенерированные данные

* Рендерин карты по одной стране
  Этот случай предусматривает манипуляцию с каждым отдельно взятым полигоном
  страны.
    svg.selectAll(".country")
        .data(world.features)
      .enter().append("path")
        .attr("class", "country")
        .attr("d", path);


## Добавление стилей

Добавить контур стран,
http://colorbrewer2.org/


## Отображение данных на карте, легенда

Данные о свободе прессы по странам с 1993 по 2014 включительно:
  https://freedomhouse.org/report-types/freedom-press


## Анимация, слайдер


## Интерактивность


## Links

http://bost.ocks.org/mike/map/
https://en.wikipedia.org/wiki/Shapefile

[1]: step-final.html
[2]: http://www.naturalearthdata.com
[3]: http://gadm.org/country
[4]: http://openlayers.org/
[5]: http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/110m/cultural/ne_110m_admin_0_countries.zip
[6]: http://www.gdal.org/ogr2ogr.html
[7]: https://github.com/mbostock/topojson
[8]: http://www.gdal.org/
