# Визуализация гео-данных в d3.js


## Что такое d3.js?

Для тех кто не слышал про d3.js, напомню, что это библиотека, имеющая широкий
спектр пременения, обладающая большой гибкостью в области визуализации данных.

В этой статье я хочу  пошагово разьяснить как сделать простую визуализацию
на географической карте при помощи связки d3.js и TopoJSON. Будут затронуты
вопросы конвертации данных и их последующая загрузка, элементы стилизаци карты
и элементы интерактивности.
В качестве предмета визуализации был выбран индекс свободы прессы, но обо всем
по порядку. Визуализация довольно проста, но поможет понять и освоить основные
приемы работы с картами в d3.js.
Итак, начнем!


## Где взять данные о картах?

Как мы знаем, карта представляет из себя контуры, линии, границы государств,
береговые линии и много другой геометрии. Для получения этих данных мы
будем обращаться к shapefile формату -  популярному формату географических
файлов. Shapefile позволяет хранить точки, линии, полигоны и другие объекты.
Также может содержать параметры типа температура, название, грубина и т.д. Hа
самом деле shapefile представляет из себя набор из трех файлов *.shp, *.shx и
*.dbf. Важно, чтобы эти три файла были расположены в одной директории.

В сети существует множество источников shapefile данных, но для меня самым
подходящим, понятным и удобным источником оказался ресурс [Natural Earth][2].
Он содержит карты территорий государств с границами (что нам и понадобится),
физические и даже растровые изображения поверхности планеты.
В качестве альтернативы можно рассмотреть [Global Administrative Areas][3] и
[OpenLayers3][4].
Мы будем использовать контурную [карту][5] масштаба 1:110м.


## Зависимости

Ниже приводятся некоторые подготовительные действия для системы Ubuntu 14.04.
Нам понадобится несколько утилит для обработки и конвертации гео-данных:

* [ogr2ogr][6]
* [TopoJSON][7]

Для topojson нам понадобится nodejs, его можно найти  собранный пакет в
репозитории.

    $ sudo apt-get install nodejs
    $ sudo apt-get install npm

Далее устанавливаем TopoJSON:

    $ sudo npm install -g topojson

Если установка бинарного пакета nodejs, то при установке возможна проблема в
духе:

    /usr/bin/env: node: No such file or directory

Для устранения достаточно прописать ссылку на nodejs:

    $ ln -s /usr/bin/nodejs /usr/bin/node

Для установки ogr2ogr достаточно установить [Geospatial Data Abstraction Library][8] (GDAL), 
которая включает в себя нужную нам утилиту:

    $ sudo apt-get install gdal-bin

Если Вы пользователь Mac, то установка происходит через brew:

    $ brew install gdal


## Конвертация данных

Сейчас наша задача состоит в том, чтобы получить из shapefiles конечный
TopoJSON файл. Для этого нам понадобиться сгенерировать промежуточный GeoJSON
файл. На этапе генерации GeoJSON файла мы получаем возможность отфильтровать
лишние, не нужные нам данные из shapefiles и привести значения
координат к меньшему числу знаков после запятой, что критично в борьбе за
скорость рендеринга, да и просто сокращает размер файла примерно на 85%.

В конечном итоге, процесс конвертации данных схематично выглядит так:

    shapefiles -> GeoJSON -> TopoJSON

Итак, приступим к конвертации. Нам нужно получить TopoJSON со странами мира.

1. Загрузка и распаковка архива
  На сайте [Natural Earth][2] в разделе "Downloads" выбираем
  "1:110m Cultural Vectors", в представленном списке выбираем раздел
  "Admin 0 – Countries" и жмём "Download countries". Очень советую зайти и
  посмотреть что вообще предлагается и какие форматы.
2. Конвертируем shapefiles данные в GeoJSON
  `$ ogr2ogr -f GeoJSON world.json ne_10m_admin_0_countries/ne_10m_admin_0_countries.shp`
  world.json - имя файла который будет создан по результату генерации.
3. Конвертируем GeoJSON в TopoJSON
  `$ topojson -o topoworld.json --id-property SU_A3 world.json`
  topoworld.json - результирующий TopoJSON файл.

Как по мне, тема работы с утилитами ogr2ogr и topojson достойна отдельной
статьи. Поиграйтесь с различными фильтрами, например, отдельно Украину с
границами областей можно получить написав:

    $ ogr2ogr -f GeoJSON -where "ADM0_A3 IN ('UKR')" ukraine.json ne_10m_admin_0_map_subunits/ne_10m_admin_0_map_subunits.shp
    $ ogr2ogr -f GeoJSON -where "ISO_A2 = 'UA' AND SCALERANK < 8" ukr_obls.json ne_10m_populated_places/ne_10m_populated_places.shp
    $ topojson -o ukr.json --id-property SU_A3 --properties name=NAME ukraine.json ukr_obls.json

Также нам понадобятся данные о свободе прессы (Freedom of the Press) последних
годов. Хороший источник данных в приемлемом формате можно найти на [Freedom House][9]. 
Данные представляют собой условный индекс свободы прессы
от 0 до 100, где - 0, наиболее свободные страны; 100 - наиболее несвободные.
Далее приведем данные к форматы csv (удобному для работы в d3.js) с таким
заголовком: `Country,ISO3166,1993,...,2014`, где:

* `Country`, название страны;
* `ISO3166`, кодовое обозначение государства в международном формате ISO 3166;
* `1993...2014`, индексы свободы прессы от 0 до 100.

Это пожалуй самое неинтересное и длительное по времени занятие - формализация
данных, но этого этапа не выкинешь.


## Загрузка данных

Приступим непосредственно к веб-разработке. Создадим html файл с такой
структурой:

    <html lang="en">
      <head>
        <meta charset="utf-8">
        <script src="http://d3js.org/d3.v3.min.js"></script>
        <script src="http://d3js.org/queue.v1.min.js"></script>
      </head>
      <body>
      </body>
    </html>

И каркас скрипта в котором будет происходить загрузка и последующая работа с
данными:

    window.onload = function () {
      function init() {
        setMap();
      }
       
      function setMap() {
        loadData();
      }
       
      function loadData() {
        queue()
          .defer(d3.json, "https://raw.githubusercontent.com/FrontenderMagazine/d3js-map-visualization/master/src/data/topoworld.json")  // карту в topoJSON формате
          .defer(d3.csv, "https://raw.githubusercontent.com/FrontenderMagazine/d3js-map-visualization/master/src/data/freedom.csv")  // данные о свободе слова в cvs формате
          .await(processData);  // обработка загруженных данных
      }
       
      function processData(error, worldMap, countryData) {
        if (error)
          return console.error(error);
        console.log(worldMap);
        console.log(countryData);
      }
       
      init();
    };


Как Вы заметили, мы использовали асинхронную библиотеку [d3-queue][10],
предназначенную для работы с d3.js и не только. В этом место происходит
ожидание загрузки файлов и передача загруженных данных функции `processData` в
перменные `worldMap` и `countryData` соответственно.

Загрузка данных в d3.js требует запуска локального сервера. Если вы
приверженец node.js, то запуск производится при помощи [http-server][11]:

    $ http-server -p 8000 &
    
или используя python2:

    $ python2 -m SimpleHTTPServer 8000

или python3:

    $ python3 -m http-server

Псоле запуска можно переходим в браузере по http://localhost:8000 и открываем
ранее [созданный нами html документ][22]. Мы увидим пустую страницу, но если откроем
консоль браузера, увидим вывод данных из загруженных файлов.

![Скриншот][Вывод в консоль]


## Отображение карты

Для рендеринга двумерной картинки на страницу браузера можно использовать 2
основных подхода: SVG и Canvas. Мы будем использовать SVG в виду того, что он
позволяет применять CSS к своим элементам.
Добавим в функцию `setMap` следующий код:

    width = 818, height = 600;
     
    svg = d3.select('#map').append('svg')
        .attr('width', width)
        .attr('height', height);

предварительно объявив в window.onload анонимной функции несколько переменных
(они нам дальше понадобятся):

    var width, height, svg, path;

так же добавим в `<body>`, элемент `<div id="map"></div>`, внутри него и будет
помещен `svg` элемент. В `<head>` надо добавить еще несколько скриптов:

    <script src="http://d3js.org/topojson.v1.min.js"></script>
    <script src="http://d3js.org/d3.geo.projection.v0.min.js"></script>

первый для работы с TopoJSON, другой с набором проекций для карт.

Для рендеринга карты необходимо еще 2 вещи: задать проекцию и создать
генератор пути (path generator).

* projection
  В метод `setMap` так же добавим, перед вызовом `loadData()`, определение
  проекции:
    
            var miller = d3.geo.miller()
                .scale(130)
                .translate([width / 2, height / 2])
                .precision(.1);

  Существует множество видов проекций, на любой вкус и цвет. Одно из
  расширений d3.js предоставляет доступ к большому разнообразию [проекций][12].

* path generator
  Для генератора пути задается определенная проекция

            var path = d3.geo.path().projection(mercator);

  Здесь создается объект, который будет превращать геоданные в множество
  последовательных линий.

Для рендеринга в функции `processData` из объекта `worldMap` (`countryData`
пока не трогаем) который представляет из себя TopoJSON получаем
GeoJSON (TopoJSON -> GeoJSON):

    var world = topojson.feature(worldMap, worldMap.objects.world);

и полученный GeoJSON преедаем в `drawMap`.

В drawMap рендеринг карты можно осуществить несколькими способами:

* Рендерин всей карты сразу. В этом случае передаем целый GeoJSON.

            svg.append("path")
               .datum(world)
               .attr("d", path);

* Рендеринг карты по одной стране
  Этот случай предусматривает манипуляцию с каждым отдельно взятым полигоном
  страны.


            var map = svg.append("g");
            map.selectAll(".country")
               .data(world.features)
               .enter()
               .append("path")
               .attr("class", "country")
               .attr("d", path);

  Метод `data` всегда принимает список. В данном случае список стран с
  соответствующей геометрией.
  
Мы будем пользоваться вторым случаем, это позволит нам осуществлять
последующие манипуляции с каждой страной (цвет, границы и т.д.).

После всех манипуляций должны получить карту с границами государств.

<iframe src="src/step-2/index.html" width="100%" height="605" />


## Отображение данных на карте, легенда

Для отрисовки данных о свободе слова нам необходимо ассоциировать их с каждой
страной и теперь наша задача добавить в GeoJSON (объект world) данные о
свободе слова (объект `countryData`).
Добавим данные код в функцию `processData` перед вызовом `drawMap(world)`:

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

Так же, рядом с переменными `width, height, svg, path`, объявим переменную
`years = []`, в которую будут записаны года с "1993" по "2014".
Теперь у атрибута `properties` каждой страны есть данные разложенные по годам.
Данные лежат таким образом что каждому значению года соответствует одно
условное значение от 0 до 100 (где, 0 - абсолютная свобода прессы,
100 - абсолютная цензура).


## Добавление цвета и стиля

Добавим немного стилей для четкости границ стран, сейчас это больше артефакты
полилиний стран, чем границы государств. Так же добавим "морской" фон для
карты, применив цвет к `<svg>` элементу.

    svg {
        background: #234c75;
        border:solid black 1px;
    }
    .country {
        stroke: black;
        stroke-width: 0.1;
    }

Если вы сейчас решили проверить промежуточный результат, то границ вы не
увидите, потому что они сливаются с цветом страны. Четкость границ будет
видна при заполнении стран цветом.

Для читаемости визуализации было выбрано цвета от темно-зеленого
(значения 0-10), до темно-красного (значения 90-100). Для подбора
соответствующих цветов был задействован ресурс [colorbrewer][13], специально
созданный для подбора цветовой гаммы гео-карт, здесь можно выбрать кол-во
цветов, природу данных и некоторые другие полезные параметры и получить превью.

![Рисунок][Набор цветов]

В `setMap()` добавим цвета и генератор цвета `getColor`, который выдает цвета
в зявисимости от значения от 0 до 100:

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

а так же добавим эти переменные в блок с переменными:

    var width, height, svg, path,
        years = [],
        colors, defColor, getColor;

Белый цвет был выбран дефолтным для стран у которых на текущий год не нашлось
данных или метрика вовсе не производилась или там совсем нет прессы :)

Добавим в блок с переменными `currentYear = "1993"` и произведем первую
итерацию визуализации данных для текущего года. Для этого сделаем вызов
`sequenceMap` в функции `drawMap`. Сама функция `sequenceMap` умеет, зная
текущий год, перерисовать цвета всех стран и имеет такой вид:

    function sequenceMap() {
        d3.selectAll('.country')
            .style('fill', function(d) {
                color = getColor(d.properties[currentYear]);
                return color ? color : defColor;
            });
    }

здесь был осуществлен проход по странам и заполнение соответствующим цветом
каждой страны, если данных не было найдено, то странна будет окрашена в белый
цвет.


## Легенда карты

Теперь на очереди добавление легенды карты. Добавим функцию `addLegend()`,
которую нужно будет вызвать вконце функции `drawMap`:

    function addLegend() {
        var lw = 200, lh = 10,  // Ширина и высота легенды
            lpad = 10,  // Отступ внутри легенды
            lcw = lw / 10;  // Ширина категорий легенды
        
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


Легенда представляет собой `<g>` (group) елемент, в котором друг за другом
расположены 10 цветных прямоугольников (`<rect>`), соответствующие градации
свободы прессы от 0 до 100.

На данном этапе карта должна представлять из себя вот такую картинку:

<iframe src="src/step-3/index.html" width="100%" height="605" />


## Слайдер

Сейчас добавим слайдер, который внесет елементы анимацию и обновление карты по
годам.
Слайдер состоит из нескольких независимых компонент:
* текстовый индикатор текущего года
* непосредственно сам слайдер
* кнопка, позволяющая прокручивать слайдер циклично в автоматическом режиме

Функция `addSlider` состоит из 3-х частей как описывалось выше. Её вызов
должен произойти сразу после вызова `addLegend` в функции drawMap и выглядит
так:

    function addSlider() {
        // Добавляем индикатор года
        svg.append("text")
            .attr("id", "year")
            .attr("transform", "translate(409,550)")
            .text(currentYear);
        // Добавляем слайдер
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
      
        // Инициализируем слайдер
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
        // Рендерим слайдер в div
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

Кнопка на событие "click" вызывает функцию `animateMap`, которая в свою
очередь производит инкремент года и вызов `sequenceMap` для обновления карты,
до тех пор пока не будет достигнут последний год в списке, после чего итерация
начинается с первого года.
А вот так выглядит функция `animateMap`:

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

Слайдер написан неким [sujeetsr][14] и был взять из [репозитория][15], немного
адаптирован под наш проект. Соответствующие стили и скрипты также нужно не
забыть подключить.

<iframe src="src/step-4/index.html" width="100%" height="605" />


## Почти конец

Напоследок хотел добавить всплывающие подсказки для каждой страны. Подсказка
представляет собой квадрат (`rect`), содержащий название страны и тренд в виде
графика индекса свободы слова за весь период по отдельно взятой стране.
Для работы с подсказкой были задействованы такие элементы d3.js, svg и техники:

* [axis][16]
* [area][17]
* line
* области с пропущенными данными ([area with missing data][18])
* [паттерн][19] обновления данных с переходами
* события мыши (mousemove, mouseover, mouseout)

Так же дополнительные материалы по картам можно прочитать [здесь][20].

И финальная версия визуализации будет выглядеть так:

<iframe src="src/step-0/index.html" width="100%" height="605" />

Полные исходники прототипа можно посмотреть [здесь][21].


## Заключение

Конечно это только малая часть того что можно делать с картами в d3.js, но
очень надеюсь, что основная цель статьи - показать и задать напрвление изучения
визуализаций на картах в d3.js, была достигнута. Дополнительные вопросы,
 предложения, критику (конструктивную), обсуждения можно вести в комментариях,
буду рад!

[1]: step-final.html
[2]: http://www.naturalearthdata.com
[3]: http://gadm.org/country
[4]: http://openlayers.org/
[5]: http//www.naturalearthdata.com/download/110m/cultural/ne_110m_admin_0_countries.zip
[6]: http://www.gdal.org/ogr2ogr.html
[7]: https://github.com/mbostock/topojson
[8]: http://www.gdal.org/
[9]: https://freedomhouse.org/report-types/freedom-press
[10]: https://github.com/d3/d3-queue
[11]: https://github.com/indexzero/http-server
[12]: https://github.com/d3/d3-geo-projection/
[13]: http://colorbrewer2.org/
[14]: https://github.com/sujeetsr
[15]: https://github.com/sujeetsr/d3.slider
[16]: https://github.com/mbostock/d3/wiki/SVG-Axes
[17]: https://bl.ocks.org/mbostock/3883195
[18]: http://bl.ocks.org/mbostock/3035090
[19]: https://bl.ocks.org/mbostock/3808234
[20]: http://bost.ocks.org/mike/map/
[21]: https://github.com/FrontenderMagazine/d3js-map-visualization/tree/master/src/step-0
[22]: src/step-4/index.html

[Набор цветов]: img/colors.png "Набор цветов"
[Вывод в консоль]: img/console.png "Вывод в консоль"
