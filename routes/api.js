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
    var data = JSON.parse(req.body.layout);
    var layout = {
        "$": {
            "title": data.title
        },
        "Insertion": []
    };
    if (data.Insertion) {
        for (var i = 0; i < data.Insertion.length; i += 1) {
            var insert = data.Insertion[i];
            //wait we need to add sources in CNG with actual dir path and append sourceref in layout before saving layout to
            //cng....get file handle from "bgImageFileName"
            var bkgFileName = insert.bgImgName+insert.bgImgExt;
            var bkgFileLocalPath = process.cwd()+"\\"+ "public\\uploads\\"+bkgFileName;
            var bkgFileURL= req.protocol+"://"+req.get('host')+"/images/"+bkgFileName;
            if(bkgFileName){
                //add source to cng and create SourceRef for this Insertion.
                var srcDetArr =  insert.bgImgName.split("_");
                cngClient.client.addSource("localImage",insert.bgImgName,srcDetArr[0],srcDetArr[1],bkgFileLocalPath,"true","","false", function(result){
                    console.log(result);
                });
            }
            //add bkgImage into the layout Area as sourceRef

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
        /*cngClient.client.addLayout(layout, function (result) {
         res.send("success");
         });*/
        res.send("success");
    } else {
        res.send("invalid data");
    }


});

router.post('/upload', function (req, res) {
    //Upload file to server.
    // Currently not using but if used 'filename' will be renamed to form field name
    //see app.js line #27
    res.send("success");
});


module.exports = router;
