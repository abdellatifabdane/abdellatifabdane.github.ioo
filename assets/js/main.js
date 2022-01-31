$(document).ready(function() {
    let regions_centroid;
    let regions_polygon;

    // Initialize the map
    // Coordinates of the center of Morocco from QGIS by right clicking on the map
    let map = L.map('map', {
        zoomSnap: 0.1,
        zoomDelta: 0.4,
        minZoom: 5
    }).setView([28.6, -9.0375], 5);
    map.zoomControl.setPosition('topleft');
    
    // Stadia tilelayer
    var OpenStreetMap_Mapnik = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);








    $.getJSON("./data/regions_centroid.json")
        .done(function(data) {
            // console.log(data);
            let info = processData(data);
            createPropSymbols(info.timestamps, data);
            createLegend(info.min, info.max);
            createSliderUI(info.timestamps);
        })
        .fail(function() {alert("There has been a problem loading the data.")});

    

    

    
    // Function to process the data
    function processData(data) {
        let timestamps = [];
        let min = Infinity;
        let max = -Infinity;

        for (let feature in data.features) {
            let properties = data.features[feature].properties;

            for (let attribute in properties) {
                if (attribute != 'id' &&
                attribute != 'r_nom' &&
                attribute != 'lat' &&
                attribute != 'long') {

                    if ($.inArray(attribute, timestamps) == -1) {
                        timestamps.push(attribute);
                    }

                    if (properties[attribute] < min) {
                        min = properties[attribute];
                    }

                    if (properties[attribute] > max) {
                        max = properties[attribute];
                    }
                }
            }
        }

        return {
            timestamps: timestamps,
            min: min,
            max: max
        }
    }

    function createPropSymbols(timestamps, data) {
        regions_centroid = L.geoJSON(data, {
            pointToLayer: function(feature, latlng) {

                return L.circleMarker(latlng, {
                    fillColor: "#708598",
                    color: "#537898",
                    weight: 1,
                    fillOpacity: 0.6
                }).on({
                    mouseover: function(e) {
                        this.openPopup();
                        this.setStyle({color: 'yellow'});
                    },
                    mouseout: function(e) {
                        this.closePopup();
                        this.setStyle({color: '#537898'});

                    }

                }).addTo(map);
            }
        });

        updatePropSymbols(timestamps[0]);
    }

    function updatePropSymbols(timestamps) {
        regions_centroid.eachLayer(function(layer) {

            let props = layer.feature.properties;
            let radius = calcPropRadius(props[timestamps]);
            let popupContent = "<b>" + String(props[timestamps]) +
            " nouveaux cas</b><br>" +
            "<i>" + props.r_nom + "<br>" +
            "</i>  </i>" +
            timestamps + "</i>" +
            " janvier 2022";
            layer.setRadius(radius);
            layer.bindPopup(popupContent, {
                offset: new L.Point(0,-radius),
                autoPan: false});
        });
    }

    function calcPropRadius(attributeValue) {
        let scaleFactor = 1;
        let area = attributeValue * scaleFactor;
        return Math.sqrt(area/Math.PI);
    }

    function createLegend(min, max) {

        if (min < 100) {
            min = 350;
        }

        function roundNumber(inNumber) {
            return (Math.round(inNumber/10) * 10);
        }

        let legend = L.control({position: 'bottomright'});

        legend.onAdd = function(map) {

            let legendContainer = L.DomUtil.create('div', 'legend');
            let symbolsContainer = L.DomUtil.create('div', 'symbolsContainer');
            let classes = [roundNumber(min), roundNumber((max-min)/2), roundNumber(max)];
            let legendCircle;
            let lastRadius = 0;
            let currentRadius;
            let margin;

            // Prevent mousedown event from propagating to the map
            L.DomEvent.disableClickPropagation(legendContainer);

            $(legendContainer).append("<h3 id='legendTitle'>Nouveaux cas</h3>");

            for (let i = 0; i<= classes.length - 1; i++) {
                legendCircle = L.DomUtil.create('div', 'legendCircle');
                currentRadius = calcPropRadius(classes[i]);
                margin = -currentRadius - lastRadius - 2;

                $(legendCircle).attr("style", "width: " + (currentRadius * 2) +
                "px; height: " + (currentRadius * 2) +
                "px; margin-left: " + margin + "px");

                $(legendCircle).append("<span class='legendValue'>" + classes[i] + ' <b><i>cas</i></b>' +"</span>");
                $(symbolsContainer).append(legendCircle);
                lastRadius = currentRadius;
            }

            $(legendContainer).append(symbolsContainer);

            return legendContainer;

        };

        legend.addTo(map);
    }

    function createSliderUI(timestamps) {
        let sliderControl = L.control({position: 'bottomleft'});
        sliderControl.onAdd = function(map) {
            let slider = L.DomUtil.create('input', 'range-slider');

            L.DomEvent.disableClickPropagation(slider);

            $(slider).attr({
                'type': 'range',
                'max': timestamps[timestamps.length - 1],
                'min': timestamps[0],
                'step': 1,
                'value': String(timestamps[0])})
                .on('input change', function() {
                    const month = " janvier 2022";
                    updatePropSymbols($(this).val().toString());
                    $(".temporal-legend").text(this.value + month);
                });
                return slider;
    }
    sliderControl.addTo(map);
    createTemporalLegend(timestamps[0]);
    }

    function createTemporalLegend(startTimestamp) {
        let temporalLegend = L.control({position: 'bottomleft'});
        temporalLegend.onAdd = function(map) {
            let output = L.DomUtil.create('output', 'temporal-legend');
            $(output).text(startTimestamp);
            return output;
    }

    temporalLegend.addTo(map);
    }

    var info = L.control();

    info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info');
        this.update();
        return this._div;
    };

    // method that we will use to update the control based on feature properties passed
    info.update = function (props) {
        this._div.innerHTML = '<h4>Carte covid, Maroc</h3>' + '<br>' + 'Passer la souris sur un symbole';
    };

    info.addTo(map);
    




});