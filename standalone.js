function fetchJSONFile(path, callback) {
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === 4) {
            if (httpRequest.status === 200) {
                var data = JSON.parse(httpRequest.responseText);
                if (callback) callback(data);
            }
        }
    };
    httpRequest.open('GET', path);
    httpRequest.send();
}

function gus_api(id, callback) {
  const url = `https://spreadsheets.google.com/feeds/cells/${id}/od6/public/basic?alt=json`;

  fetchJSONFile(url, function(data) {

    let headers = {};
    let entries = {};

    data.feed.entry.forEach((e) => {
      // get the row number
      const row = parseInt(e.title['$t'].match(/\d+/g)[0]);
      const column = e.title['$t'].match(/[a-zA-Z]+/g)[0];
      const content = e.content['$t'];

      // it's a header
      if (row === 1) {
        headers[column] = content;
      } else {
        if (!entries[row]) entries[row] = {};
        entries[row][headers[column]] = content;
      }
    });

    const gj = { type: 'FeatureCollection', features: [] };
    for (let e in entries) {

      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [0, 0]
        },
        properties: entries[e]
      };

      for (let p in entries[e]) {
        switch(p) {
          case 'longitude':
          case 'LONGITUDE':
          case 'long':
          case 'LONG':
          case 'lng':
          case 'LNG':
          case 'lon':
          case 'LON':
          case 'x':
          case 'X':
            feature.geometry.coordinates[0] = parseFloat(entries[e][p]);
          case 'latitude':
          case 'LATITUDE':
          case 'lat':
          case 'LAT':
          case 'y':
          case 'Y':
            feature.geometry.coordinates[1] = parseFloat(entries[e][p]);
        }
      }

      gj.features.push(feature);
    }

    callback(gj);
  });
};
