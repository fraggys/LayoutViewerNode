var express = require('express');
var router = express.Router();
var cngClient = require('../lib/cngClient');

/* GET API listing. */

/*return compostion list*/
router.get('/compositions', function (req, res, next) {
    cngClient.client.getCompositions(function (result) {
        res.json(result);
    });
});

/*returns array of sources*/
router.get('/sources', function (req, res, next) {
    cngClient.client.getSources("screen", function (result) {
        res.json(result.source);
    });
});

/*returns array of layouts*/
router.get('/layouts', function (req, res, next) {
    cngClient.client.getCustomLayouts("screen", function (result) {
        res.json(result);
    });
});

/* POST API listing */

router.post('/layout', function (req, res, next) {
    /*layout = {$: { "title":"Two sources" }, "Insertion":[ {
     $: { "x": 0.0, "y": 0.0, "width": 0.5, "height": 1.0 },
     "SourceRef": { $:{"deviceId":6003,"channelId":0 }}
     }]} */
    console.log("getting post request");
    //console.dir(req.body);
    var data = req.body;
    var layout = {
        "$": {
            "title": data.title
        },
        "Insertion": []
    };
    if (data.Insertion) {
        for (var i = 0; i < data.Insertion.length; i += 1) {
            var insert = data.Insertion[i];
            layout.Insertion.push({
                "$": {
                    "x": insert.x,
                    "y": insert.y,
                    "width": insert.width,
                    "height": insert.height
                },
                "SourceRef": {
                    "$": {
                        "deviceId": insert.sourceRef.deviceId,
                        "channelId": insert.sourceRef.channelId
                    }
                }
            });
        }
    }
    cngClient.client.addLayout(layout, function (result) {
        res.send("success");
    });
});

module.exports = router;
