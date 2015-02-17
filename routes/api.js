var express = require('express');
var router = express.Router();
var cngClient = require('../lib/cngClient');

/* GET API listing. */

/*return compostion list*/
router.get('/compositions', function (req, res, next) {
    cngClient.client.getCompositions(function (result) {
        res.send(result);
    });
});

/*returns array of sources*/
router.get('/sources', function (req, res, next) {
    cngClient.client.getSources("screen", function (result) {
        res.send(result.source);
    });
});

/*returns array of layouts*/
router.get('/layouts', function (req, res, next) {
    cngClient.client.getCustomLayouts("screen", function (result) {
        res.send(result);
    });
});

/* POST API listing */
router.get('/layout', function (req, res, next) {
    layout = {
        $: {
            "title":"2sources"
        },
        "Insertion":[ {
            $: {
                "x": 0.0,
                "y": 0.0,
                "width": 0.5,
                "height": 1.0
            },
            "SourceRef": {
                $:{
                    "deviceId":6003,
                    "channelId":0
                }
            }
        }, {
            $: {
                "x": 0.5,
                "y": 0.0,
                "width": 0.5,
                "height": 1.0
            },
            "SourceRef": {
                $:{
                    "deviceId":6002,
                    "channelId":0
                }
            }
        }]
    };
    cngClient.client.addLayout(layout, function (result) {
        res.send(result);
    });
});


module.exports = router;
