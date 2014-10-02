var myMap;

ymaps.ready(function () {
    myMap = new ymaps.Map('map', {
        zoom: 4,
        center: [54.78, 30.08]
    });
    var myPlacemark = new ymaps.Placemark([55.76, 37.64], {
        balloonContent: 'Я вышел за границы карты'
    }, {
        balloonPanelMaxMapArea: 0
    });

    observeEvents(myMap);

    myMap.geoObjects.add(myPlacemark);
    myPlacemark.balloon.open();
});

function observeEvents (map) {
    var mapEventsGroup,
        mapBalloonEventsGroup = map.balloon.events
            // При открытии балуна начинаем слушать изменение центра карты.
            .add('open', function (e1) {
                var placemark = e1.get('target');

                // Вызываем функцию в двух случаях:
                mapEventsGroup = map.events.group()
                    // 1) в начале движения (если балун во внешнем контейнере);
                    .add('actiontick', function (e2) {
                        if (placemark.options.get('balloonPane') == 'outerBalloon') {
                            setBalloonPane(placemark, e2.get('tick'));
                        }
                    })
                    // 2) в конце движения (если балун во внутреннем контейнере).
                    .add('actiontickcomplete', function (e2) {
                        if (placemark.options.get('balloonPane') != 'outerBalloon') {
                            setBalloonPane(placemark, e2.get('tick'));
                        }
                    });

                // Вызываем функцию сразу после открытия.
                setBalloonPane(placemark);
            })
            // При закрытии балуна удаляем слушатели.
            .add('close', function () {
                mapEventsGroup.removeAll();
            });
}

function setBalloonPane (placemark, mapData) {
    mapData = mapData || {
        globalPixelCenter: myMap.getGlobalPixelCenter(),
        zoom: myMap.getZoom()
    };

    var mapSize = myMap.container.getSize(),
        mapBounds = [
            [mapData.globalPixelCenter[0] - mapSize[0] / 2, mapData.globalPixelCenter[1] - mapSize[1] / 2],
            [mapData.globalPixelCenter[0] + mapSize[0] / 2, mapData.globalPixelCenter[1] + mapSize[1] / 2]
        ],
        balloonPosition = placemark.balloon.getPosition(),
    // Используется при изменении зума.
        zoomFactor = Math.pow(2, mapData.zoom - myMap.getZoom()),
    // Определяем, попадает ли точка привязки балуна в видимую область карты.
        pointInBounds = ymaps.util.bounds.contains(mapBounds, [
            balloonPosition[0] * zoomFactor,
            balloonPosition[1] * zoomFactor
        ]),
        isInOutersPane = placemark.options.get('balloonPane') == 'outerBalloon';

    // Если точка привязки не попадает в видимую область карты, переносим балун во внутренний контейнер
    if (!pointInBounds && isInOutersPane) {
        placemark.options.set({
            balloonPane: 'balloon',
            balloonShadowPane: 'shadows'
        });
        // и наоборот.
    } else if (pointInBounds && !isInOutersPane) {
        placemark.options.set({
            balloonPane: 'outerBalloon',
            balloonShadowPane: 'outerBalloon'
        });
    }
}