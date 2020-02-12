var mapping = function () {
    var mode = {
        // thank you tsiauw
        getQueryContent: function (q) {
            return datasets.filter(function (d) {
                return d.queryName == q;
            })[0].content
        },
        getQueryColumns: function (q) {
            return datasets.filter(function (d) {
                return d.queryName == q;
            })[0].columns
        }
    }

    var basemap = {
        init: function (o) {
            var map_id = o['map_id'],
                mapbox_token = o['mapbox_token'],
                center = o['center'] || [39.09, -98.505],
                zoom = o['zoom'] || 10,
                height = o['height'] ? o['height'] + 'px' : '50vh'
            if (!map_id) console.error('Need map_id')
            var chart = L.DomUtil.get(map_id)
            var parent = chart.parentNode
            var container = L.DomUtil.create('div', 'map-container', parent)

            chart.innerHTML = ''
            container.style.display = 'block'
            container.style.height = height

            var map = L.map(container).setView(center, zoom)
            if (mapbox_token) {
                L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
                    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                    maxZoom: 18,
                    id: 'mapbox/streets-v11',
                    accessToken: mapbox_token
                }).addTo(map);
            } else {
                L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map)
            }
            return map
        }
    }

    var plt = {
        geojson: function (o) {
            // PARAMS: map_id, token, query_name
            var mapId = o['map_id'],
                height = o['height'],
                token = o['token'] || null,
                queryName = o['query_name'] || 'Query 1',
                center = o['center'],
                zoom = o['zoom'],
                geojsonCol = o['geojson_col'],
                fillOpacity = o['fill_opacity'] || 0.7,
                colorBy = o['color_by_col'],
                colorBounds = o['color_by_bounds'],
                numColors = o['num_colors'] || 4,
                colorScheme = o['color_scheme'] || 'sequential', // one of ('categorical' or 'sequential') default sequential
                showLegend = o['show_legend'] || false,
                colors = o['colors']

            var data = mode.getQueryContent(queryName)
            var map = basemap.init({
                map_id: mapId,
                mapbox_token: token,
                center: center,
                zoom: zoom,
                height: height
            })

            var inferred_columns = util.inferColumns(mode.getQueryColumns(queryName))
            geojsonCol = geojsonCol || inferred_columns.geojson

            colorBounds = colorBounds || util.inferColorBounds(colorBy, data)
            var colorScale = util.generateColorScale(colorBounds, numColors, colorScheme, colors)
            var legend = util.generateLegend(colorScale, colorBy)

            var info = L.control();
            info.onAdd = function (map) {
                this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
                this.update();
                return this._div;
            };
            // method that we will use to update the control based on feature properties passed
            info.update = function (props) {
                this._div.innerHTML = props ? util.generateDataHTML(inferred_columns.data, props) : 'Hover over something'
            };

            function style(feature) {
                return {
                    fillColor: util.getColor(feature.properties[colorBy], colorScale),
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: fillOpacity
                };
            }

            function highlightFeature(e) {
                var layer = e.target;

                layer.setStyle({
                    weight: 5,
                    color: '#666',
                    dashArray: '',
                    fillOpacity: 0.7
                });

                if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                    layer.bringToFront();
                }
                info.update(layer.feature.properties)
            }

            function resetHighlight(e) {
                geojson.resetStyle(e.target);
                e.target.bringToBack();
            }

            function zoomToFeature(e) {
                map.fitBounds(e.target.getBounds());
            }

            function onEachFeature(feature, layer) {
                layer.on({
                    mouseover: highlightFeature,
                    mouseout: resetHighlight,
                    click: zoomToFeature
                });
            }
            // instantiating empty geojson layer
            var geojson = L.geoJSON(null, {
                style: style,
                onEachFeature: onEachFeature
            }).addTo(map)

            // adding the layers
            for (var i = 0; i < data.length; i++) {
                var row = data[i]
                // need to add the row params to the feature
                geojson.addData(util.parseAndAddProps(row[geojsonCol], row))
            }

            info.addTo(map)
            if (showLegend) {
                legend.addTo(map)
            }

            return map
        },
        points: function (o) {
            // PARAMS: map_id, token*, query_name, lat_col*, lng_col*
            var mapId = o['map_id'],
                height = o['height'],
                token = o['token'],
                queryName = o['query_name'] || 'Query 1',
                lat = o['lat_col'],
                lng = o['lng_col'],
                radius = o['radius'] || 10,
                fillOpacity = o['fill_opacity'] || 0.7,
                center = o['center'],
                zoom = o['zoom'],
                colorBy = o['color_by_col'],
                colorBounds = o['color_by_bounds'],
                numColors = o['num_colors'] || 1,
                colorScheme = o['color_scheme'] || 'categorical', // one of ('categorical' or 'sequential') default categorical
                showLegend = o['show_legend'] || false,
                colors = o['colors']

            var data = mode.getQueryContent(queryName)
            var map = basemap.init({
                map_id: mapId,
                mapbox_token: token,
                center: center,
                zoom: zoom,
                height: height
            })
            var inferred_columns = util.inferColumns(mode.getQueryColumns(queryName))
            lat = lat || inferred_columns.lat
            lng = lng || inferred_columns.lng

            colorBounds = colorBounds || util.inferColorBounds(colorBy, data)
            var colorScale = util.generateColorScale(colorBounds, numColors, colorScheme, colors)
            var legend = util.generateLegend(colorScale, colorBy)

            for (var i = 0; i < data.length; i++) {
                var row = data[i]
                L.circleMarker([row[lat], row[lng]], {
                    color: util.getColor(row[colorBy], colorScale),
                    fillColor: util.getColor(row[colorBy], colorScale),
                    fillOpacity: fillOpacity,
                    radius: radius
                }).bindTooltip(util.generateDataHTML(inferred_columns.data, row)).addTo(map)
            }
            if (showLegend) {
                legend.addTo(map)
            }
            return map
        },
        geohashes: function (o) {
            // PARAMS: map_id, token*, query_name, lat_col*, lng_col*, geohash_col*, fillOpacity*
            var mapId = o['map_id'],
                height = o['height'],
                token = o['token'],
                queryName = o['query_name'] || 'Query 1',
                lat = o['lat_col'],
                lng = o['lng_col'],
                geohash = o['geohash_col'],
                fillOpacity = o['fill_opacity'] || 0.7,
                center = o['center'],
                zoom = o['zoom'],
                colorBy = o['color_by_col'],
                colorBounds = o['color_by_bounds'],
                numColors = o['num_colors'] || 4,
                colorScheme = o['color_scheme'] || 'sequential', // one of ('categorical' or 'sequential') default sequential
                showLegend = o['show_legend'] || false,
                colors = o['colors']

            var data = mode.getQueryContent(queryName)
            var inferred_columns = util.inferColumns(mode.getQueryColumns(queryName))
            lat = lat || inferred_columns.lat
            lng = lng || inferred_columns.lng
            geohash = geohash || inferred_columns.geohash

            var map = basemap.init({
                map_id: mapId,
                mapbox_token: token,
                center: center,
                zoom: zoom,
                height: height
            })
            
            colorBounds = colorBounds || util.inferColorBounds(colorBy, data)
            var colorScale = util.generateColorScale(colorBounds, numColors, colorScheme, colors)
            var legend = util.generateLegend(colorScale, colorBy)
            for (var i = 0; i < data.length; i++) {
                var row = data[i]
                var gh = L.rectangle(
                    geohash ? util.geohash.decode(row[geohash]).corners : util.geohash.decode(util.geohash.encode(row[lat], row[lng])).corners, {
                    weight: 1,
                    color: util.getColor(row[colorBy], colorScale),
                    fillOpacity: fillOpacity,
                    fillColor: util.getColor(row[colorBy], colorScale)
                }
                ).bindTooltip(util.generateDataHTML(inferred_columns.data, row))

                gh.addTo(map)
            }
            
            if (showLegend) {
                legend.addTo(map)
            }
            return map
        },
        arcs: function (o) {
            // PARAMS: map_id, token*, query_name, lat_col*, lng_col*, fillOpacity*
            var mapId = o['map_id'],
                height = o['height'],
                token = o['token'],
                queryName = o['query_name'] || 'Query 1',
                fromLat = o['from_lat'],
                fromLng = o['from_lng'],
                toLat = o['to_lat'],
                toLng = o['to_lng'],
                fillOpacity = o['fill_opacity'] || 0.7,
                center = o['center'],
                zoom = o['zoom'],
                radius = o['radius'] || 10,
                colorBy = o['color_by_col'],
                colorBounds = o['color_by_bounds'],
                numColors = o['num_colors'] || 1,
                colorScheme = o['color_scheme'] || 'categorical', // one of ('categorical' or 'sequential') default categorical
                showLegend = o['show_legend'] || false,
                colors = o['colors']

            var data = mode.getQueryContent(queryName)
            var inferred_columns = util.inferColumns(mode.getQueryColumns(queryName))

            var map = basemap.init({
                map_id: mapId,
                mapbox_token: token,
                center: center,
                zoom: zoom,
                height: height
            })

            colorBounds = colorBounds || util.inferColorBounds(colorBy, data)
            var colorScale = util.generateColorScale(colorBounds, numColors, colorScheme, colors)
            var legend = util.generateLegend(colorScale, colorBy)
            for (var i = 0; i < data.length; i++) {
                var row = data[i]
                // origin dot
                L.circleMarker([row[fromLat], row[fromLng]], {
                    color: util.getColor(row[colorBy], colorScale),
                    fillColor: util.getColor(row[colorBy], colorScale),
                    fillOpacity: fillOpacity,
                    radius: radius,
                    stroke: false
                }).bindTooltip(util.generateDataHTML(inferred_columns.data, row)).addTo(map)
                // destination dot
                L.circleMarker([row[toLat], row[toLng]], {
                    color: util.getColor(row[colorBy], colorScale),
                    // fillColor: util.getColor(row[colorBy], colorScale),
                    fillOpacity: fillOpacity,
                    radius: radius
                }).bindTooltip(util.generateDataHTML(inferred_columns.data, row)).addTo(map)
                // drawing the arc
                L.curve([
                    'M', 
                    [row[fromLat], row[fromLng]], 
                    'Q', 
                    util.getMidPoint([row[fromLat], row[fromLng]], [row[toLat], row[toLng]]), 
                    [row[toLat], row[toLng]]
                ], {
                    color: util.getColor(row[colorBy], colorScale),
                    opacity: 0.8,
                    weight: 3
                }).addTo(map)
            }
            if (showLegend) {
                legend.addTo(map)
            }
            return map
        }
    }

    var util = {
        getMidPoint: function(from, to) {
            // mid-point of line:
            var mpx = (from[1] + to[1]) * 0.5;
            var mpy = (from[0] + to[0]) * 0.5;

            // angle of perpendicular to line:
            var theta = Math.atan2(to[0] - from[0], to[1] - from[1]) - Math.PI / 2;

            // euclidian distance
            var dist = Math.sqrt((to[0] - from[0]) ** 2 + (to[1] - from[1]) ** 2)
            // distance of control point from mid-point of line:
            var offset = 0.25 * dist;

            // location of control point:
            var c1x = mpx + offset * Math.cos(theta);
            var c1y = mpy + offset * Math.sin(theta);

            return [c1y, c1x]
        },
        generateDataHTML: function (columns, row) {
            text = ''
            for (var i = 0; i < columns.length; i++) {
                text += '<p>' + columns[i] + ': ' + row[columns[i]] + '</p>'
            }
            return text
        },
        generateLegend: function(colorScale, colorBy) {
            var legend = L.control({
                position: 'bottomright'
            });
            var div = L.DomUtil.create('div', 'info legend')
            div.innerHTML += '<h4>' + colorBy + '</h4>'
            for (var i = 0; i < colorScale.n; i++) {
                div.innerHTML +=
                    '<i style="background:' + colorScale.colors[i] + '"></i> ' + 
                    (colorScale.breaks[i - 1] ? colorScale.breaks[i - 1] + '&ndash;' : '<') + colorScale.breaks[i] + '<br>'
            }
            legend.onAdd = function (map) {
                return div;
            };

            return legend
        },
        inferColorBounds: function (colorBy, data) {
            var min, max
            for (var i = 0; i < data.length; i++) {
                var row = data[i]
                if (i == 0) { 
                    min = row[colorBy]
                    max = row[colorBy]
                }
                if (row[colorBy] < min) min = row[colorBy];
                if (row[colorBy] > max) max = row[colorBy];
            }
            return [min, max]
        },
        inferColumns: function (columns) {
            // returns an object with name of the geojson, lat and lng columns
            var inferred_columns = {
                geojson: null,
                lat: null,
                lng: null,
                geohash: null,
                data: []
            }

            columns.forEach(function (col) {
                if (col.name.includes('geojson')) {
                    inferred_columns.geojson = col.name
                } else if (col.name.includes('geohash')) {
                    inferred_columns.geohash = col.name
                }
                // TODO: update for regex
                else if (col.name.includes('lat') || col.name.includes('latitude')) {
                    inferred_columns.lat = col.name
                } else if (col.name.includes('lng') || col.name.includes('longitude')) {
                    inferred_columns.lng = col.name
                } else {
                    inferred_columns.data.push(col.name)
                }
            })

            return inferred_columns
        },
        parseAndAddProps: function (geojson, data) {
            geojson = JSON.parse(geojson)

            if (geojson.type === 'Feature') {
                // probably implement some error checking but okay for now
                geojson.feature.properties = data
            }

            if (geojson.type === 'FeatureCollection') {
                for (var i = 0; i < geojson.features.length; i++) {
                    geojson.features[i].properties = data
                }
            }

            return geojson
        },
        getColor: function (val, colorScale) {
            for (var i = 0; i < colorScale.n; i++) {
                if (val < colorScale.breaks[i]) return colorScale.colors[i]
            }
            return colorScale.colors[colorScale.n - 1]
        },
        generateColorScale: function(bounds, n, type, c) {
            var min = bounds[0],
                max = bounds[1],
                colorPalette = c
            var LYFT_CATEGORICAL_EXTENDED = [
                '#523BE4',
                '#FF5187',
                '#347D00',
                '#82D2FF',
                '#651A00',
                '#8481FF',
                '#E51966',
                '#A4DC48',
                '#043563',
                '#FF7232',
                '#665AFF',
                '#FFA0BA',
                '#155600',
                '#3A97D3',
                '#D03D00',
                '#BABAFF',
                '#8B0040',
                '#5EAB00',
                '#135B96',
                '#FFB38F'
            ]
            var SEQUENTIAL_9 = ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026']
            if (!colorPalette) {
                colorPalette = (type == 'sequential') ? SEQUENTIAL_9 : LYFT_CATEGORICAL_EXTENDED
            }
            var chunk_size = (max - min) * 1.0 / n
            var breaks = []
            var colors = []
            for (var i = 0; i < n; i++) {
                breaks.push(min + chunk_size * (i + 1))
                colors.push(colorPalette[i])
            }
            
            return {
                breaks,
                colors,
                n
            }
        },
        geohash: function () {
            // geohash.js
            // Geohash library for Javascript
            // (c) 2008 David Troy
            // Distributed under the MIT License
            // Modified from https://github.com/davetroy/geohash-js/commit/463cb69f97115bb104e9f4137215c8e3503a5e40

            var BITS = [16, 8, 4, 2, 1],
                BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz",
                NEIGHBORS = {
                    right: {
                        even: "bc01fg45238967deuvhjyznpkmstqrwx"
                    },
                    left: {
                        even: "238967debc01fg45kmstqrwxuvhjyznp"
                    },
                    top: {
                        even: "p0r21436x8zb9dcf5h7kjnmqesgutwvy"
                    },
                    bottom: {
                        even: "14365h7k9dcfesgujnmqp0r2twvyx8zb"
                    }
                },
                BORDERS = {
                    right: {
                        even: "bcfguvyz"
                    },
                    left: {
                        even: "0145hjnp"
                    },
                    top: {
                        even: "prxz"
                    },
                    bottom: {
                        even: "028b"
                    }
                }

            NEIGHBORS.bottom.odd = NEIGHBORS.left.even;
            NEIGHBORS.top.odd = NEIGHBORS.right.even;
            NEIGHBORS.left.odd = NEIGHBORS.bottom.even;
            NEIGHBORS.right.odd = NEIGHBORS.top.even;

            BORDERS.bottom.odd = BORDERS.left.even;
            BORDERS.top.odd = BORDERS.right.even;
            BORDERS.left.odd = BORDERS.bottom.even;
            BORDERS.right.odd = BORDERS.top.even;

            var refine_interval = function (interval, cd, mask) {
                if (cd & mask)
                    interval[0] = (interval[0] + interval[1]) / 2;
                else
                    interval[1] = (interval[0] + interval[1]) / 2;
            }

            var decode = function (geohash) {
                var is_even = 1;
                var lat = [];
                var lon = [];
                lat[0] = -90.0;
                lat[1] = 90.0;
                lon[0] = -180.0;
                lon[1] = 180.0;
                lat_err = 90.0;
                lon_err = 180.0;

                for (i = 0; i < geohash.length; i++) {
                    c = geohash[i];
                    cd = BASE32.indexOf(c);
                    for (j = 0; j < 5; j++) {
                        mask = BITS[j];
                        if (is_even) {
                            lon_err /= 2;
                            refine_interval(lon, cd, mask);
                        } else {
                            lat_err /= 2;
                            refine_interval(lat, cd, mask);
                        }
                        is_even = !is_even;
                    }
                }
                lat[2] = (lat[0] + lat[1]) / 2;
                lon[2] = (lon[0] + lon[1]) / 2;

                return {
                    lat: lat[2],
                    lng: lon[2],
                    corners: [
                        [lat[1], lon[0]],
                        [lat[0], lon[1]]
                    ]
                };
            }

            var encode = function (latitude, longitude, p) {
                var is_even = 1;
                var i = 0;
                var lat = [];
                var lon = [];
                var bit = 0;
                var ch = 0;
                var precision = p || 8;
                geohash = "";

                lat[0] = -90.0;
                lat[1] = 90.0;
                lon[0] = -180.0;
                lon[1] = 180.0;

                while (geohash.length < precision) {
                    if (is_even) {
                        mid = (lon[0] + lon[1]) / 2;
                        if (longitude > mid) {
                            ch |= BITS[bit];
                            lon[0] = mid;
                        } else
                            lon[1] = mid;
                    } else {
                        mid = (lat[0] + lat[1]) / 2;
                        if (latitude > mid) {
                            ch |= BITS[bit];
                            lat[0] = mid;
                        } else
                            lat[1] = mid;
                    }

                    is_even = !is_even;
                    if (bit < 4)
                        bit++;
                    else {
                        geohash += BASE32[ch];
                        bit = 0;
                        ch = 0;
                    }
                }
                return geohash;
            }

            return {
                decode: decode,
                encode: encode
            }

        }()
    }

    return {
        basemap: basemap,
        plt: plt,
        mode: mode
    }
}()
