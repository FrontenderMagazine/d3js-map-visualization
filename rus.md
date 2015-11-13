# Географические карты в d3.js


### Что такое d3.js?

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
    http://www.naturalearthdata.com/downloads/ (вся карта мира, с частичными регионами и областями)
    http://gadm.org/country (с регионами областями)
    http://openlayers.org/

Данные в нормальном виде:
    https://freedomhouse.org/report-types/freedom-press
Здесь красиво, подсмотрел кое что для себя:
    https://rsf.org/index2014/en-index2014.php
    http://ec.europa.eu/eurostat/web/regions/statistics-illustrated

## Формализация, обработка и формат данных?

## Какие карты бывают

## Визуализация данных на картах (виды визуализаций)

## Интерактивные карты

## Links
