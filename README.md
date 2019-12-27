# Mapping for Mode

## Setup
1. Copy and paste the following lines to the top of your HTML for the mode report.
```
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.6.0/dist/leaflet.css"
    integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
    crossorigin="">
<script src="https://unpkg.com/leaflet@1.6.0/dist/leaflet.js"
    integrity="sha512-gZwIG9x3wUXg2hdXF6+rVkLF/0Vi9U8D2Ntg4Ga5I5BZpVkVxlJWbSQtXPSiUTtC0TjtGOmxa1AJPuV0CPthew=="
    crossorigin=""></script>
<script src='https://cdn.jsdelivr.net/npm/leaflet-curve@1.0.0/leaflet.curve.min.js'></script>
<script src='https://cdn.jsdelivr.net/gh/ajsun/mode-mapping@master/mapping.js'></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ajsun/mode-mapping@master/mapping.css">
```

2. Make any mode chart thats the same size as where you want the map.
3. Go the HTML editor and find the id of the chart you'd like to replace. The line should look something like:
```<mode-chart id="chart_12341234" dataset="dataset" options="chart_options"></mode-chart>```
What you want is the part that comes after id (i.e. `chart_12341234`
4. At the end of the html you can then add your map as follows
```
<script>
mapping.plt.geohashes({
    map_id: 'chart_12341234',
    token: 'Your mapbox token', // optional
    query_name: 'Query 1',
    geohash_col: 'gh6',
    color_by_col: 'revenue',
    color_by_bounds: [0, 100], // optional, can be inferred 
    num_colors: 10 // MAX 10
})
 </script>
```

## API
#### Points
Inputs:
- `map_id` is the id of the mode chart you'd like to overwrite (ex: `chart_12341234`)
- `token` *optional* is the mapbox token 
- `query_name` is the name of the query containing the data you'd like to use
- `lat_col` *optional* is the name of the latitude column (if you don't provide we will infer)
- `lng_col` *optional* is the name of the longitude column (if you don't provide we will infer)
- `radius` radius of the point
- `fillOpacity` opacity of the fill of the point
- `center` starting center of the map
- `zoom` zoom level of the map
- `color_by_col` column name for a metric that will dictate coloring
- `color_by_bounds` *optional* min and max values for the metric you are coloring by
- `num_colors` the number of distinct colors you'd like to use

















