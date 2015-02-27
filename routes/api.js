var express = require('express');
var router = express.Router();
var cngClient = require('../lib/cngClient');

/* GET API listing. */

/*return composition list*/
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
    var data = JSON.parse(req.body.layout);
    var layout = {
        "$": {
            "title": data.title
        },
        Insertion: []
    };

    if (data.Insertion) {
        var cngCmdArr = []; //it will contain list of insertion or region in order they need to be shown.
        for (var i = 0; i < data.Insertion.length; i += 1) {
            //NOTE: IMPORTANT server will create a Insertion,for bg Image, with dimensions same as parent insert/region.
            var insert = data.Insertion[i];
            //create a bg insertion
            var child;
            var bkgInsertion = createInsertion(insert.x, insert.y, insert.width, insert.height);
            if (insert.bgImgName) {
                var bkgFileName = insert.bgImgName + insert.bgImgExt;
                var bkgFileLocalPath = process.cwd() + "\\" + "public\\uploads\\" + bkgFileName;
                //var bkgFileURL = req.protocol + "://" + req.get('host') + "/images/" + bkgFileName;
                cngClient.client.addSource("localImage", insert.bgImgName, data.title, insert.id, bkgFileLocalPath, "true", "", "false", function (result) {
                    //anything after add source.
                 });
                bkgInsertion["SourceRef"] = createSourceRef(data.title, insert.id);
            }
            if (insert.type === 'Region') {
                //create Region Element
                child = {
                    $: {
                        x: insert.x,
                        y: insert.y,
                        width: insert.width,
                        height: insert.height,
                        layoutType: insert.region.layoutType,
                        usedForSourcesOfTypesOrWithTag: insert.region.extraTag
                    }
                };
                bkgInsertion["Region"] = child;
            }
            else if (insert.type == "Insertion") {
                var newInsertion = "";
                //no sourceRef no new Insertion and no decorators
                if (!!insert.sourceRef && !!insert.sourceRef.deviceId && !!insert.sourceRef.channelId) {
                    newInsertion = createInsertion(insert.x, insert.y, insert.width, insert.height);
                    //Create SourceRef
                    newInsertion["SourceRef"] = createSourceRef(insert.sourceRef.deviceId, insert.sourceRef.channelId)
                    //annotation - text provided
                    if (insert.annotation.text) {
                        newInsertion["Annotation"] = {
                            $: {
                                fontSize: insert.annotation.size,
                                text: insert.annotation.text,
                                fontItalic: insert.annotation.italic,
                                position: insert.annotation.position,
                                fontWeight: insert.annotation.wt
                            },
                            Color: createColor(insert.annotation.color),
                            BackgroundColor: createColor(insert.annotation.bgColor)
                        };
                    }
                    //border - if thickness given
                    if (insert.border.thickness > 0) {
                        var border = {
                            $: {
                                thickness: insert.border.thickness,
                            },
                            Color: createColor(insert.border.color)
                        }
                        if(!!insert.border.blinkSpeed){
                            border.blink = !!insert.border.blinkSpeed;
                            border.blinkRate =insert.border.blinkSpeed
                        }
                        newInsertion["Border"] = border;
                    }
                    bkgInsertion["Insertion"] = newInsertion;
                }
            }
            layout.Insertion.push(bkgInsertion);
        }
        console.log(JSON.stringify(layout));
        cngClient.client.addLayout(layout, function (result) {
            res.send("success");
        });

        function createColor(hash) {
            if (hash) {
                var hashVal = (hash.charAt(0) == "#") ? hash.substring(1, 7) : hash;
                return {
                    "$": {
                        red: parseInt((hashVal.substring(0, 2)), 16),
                        green: parseInt((hashVal.substring(2, 4)), 16),
                        blue: parseInt((hashVal.substring(4, 6)), 16),
                        alpha: 0
                    }
                };
            }
        }

        function createInsertion(x, y, w, h) {
            return {
                "$": {
                    "x": x,
                    "y": y,
                    "width": w,
                    "height": h
                }
            };
        }

        function createSourceRef(deviceId, channelId) {
            return {
                "$": {
                    "deviceId": deviceId,
                    "channelId": channelId
                }
            }
        }
    }
    else {
        res.send("invalid data");
    }
})
;

router.post('/upload', function (req, res) {
    //Upload file to server.
    // Currently not using but if used 'filename' will be renamed to form field name
    //see app.js line #27
    res.send("success");
});


module.exports = router;
