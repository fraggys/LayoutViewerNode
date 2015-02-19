'use strict';

layoutEditorApp.controller('MainCtrl', function ($scope, $http) {
    $scope.options = [
        {label: 'Change Layout', value: ''},
        {label: 'Create New Layout', value: {}}
    ];
    $http.get('/api/layouts')
        .success(function (data, status, headers, config) {
            data.forEach(function (layout) {
                $scope.options.push({
                    label: layout.$.title,
                    value: createSourceAreaFromLayoutData(layout.Insertion)
                });
            });
        })
        .error(function (data, status, headers, config) {
            //TODO handle error
        });
    //init select-menu.
    $scope.layoutMaster = $scope.options[0];

    $("#addBtn").button({
        icons: {
            primary: "ui-icon-plus"
        }
    });
    $("#saveBtn").button({
        icons: {
            primary: "ui-icon-disk"
        }
    });

    $("#source").contextmenu({
        delegate: ".hasmenu",
        menu: [
            {title: "Copy", cmd: "copy", uiIcon: "ui-icon-copy"},
            {title: "----"},
            {title: "More", children: [
                {title: "Sub 1", cmd: "sub1"},
                {title: "Sub 2", cmd: "sub1"}
            ]}
        ],
        select: function(event, ui) {
            alert("select " + ui.cmd + " on " + ui.target.text());
        }
    });

    //keep parentElemDimensions
    var parentElem = $(".parent")[0];
    $scope.canvasX = (parentElem.offsetLeft) + 2;
    $scope.canvasY = (parentElem.offsetTop) + 2;
    $scope.canvasW = (parentElem).offsetWidth;
    $scope.canvasH = (parentElem).offsetHeight;

    $scope.$watch('activeObject', function (newVal) {
        if (newVal) {
            var id = '#' + newVal.id;
            $(id).offset({"top": newVal.insertion.posY, "left": newVal.insertion.posX})
                .outerWidth(newVal.insertion.width)
                .outerHeight(newVal.insertion.height);
        }
    }, true);

    $scope.addSourceArea = function () {
        var id = generateUUId();
        var srcArea = {
            id: id,
            insertion: {
                posX: "",
                posY: "",
                relX: "",
                relY: "",
                relW:"",
                relH:"",
                width: "",
                height: "",
                sourceRef: {
                    deviceId: "",
                    channelId: ""
                }
            }
        };
        console.log($scope.layoutMaster.value);
        $scope.layoutMaster.value[id] = srcArea;
    };

    /*util functions for backend data mapping*/

    $scope.saveLayout = function () {
        createLayoutObjectFromSourceArea($scope.layoutMaster.label, $scope.layoutMaster.value);
    };

    function calcAbsDim(){}
    function calcRelDim(){}


    function generateUUId() {
        return new Date().getTime();
    }

    function createSourceAreaFromLayoutData(insertionArr) {
        var retObj = {};
        insertionArr.forEach(function (entry) {
            var srcAreaObj = {};
            srcAreaObj.id = generateUUId();
            srcAreaObj.insertion = {};
            srcAreaObj.insertion.posX = entry.$.x;
            srcAreaObj.insertion.posY = entry.$.y;
            srcAreaObj.insertion.height = entry.$.height;
            srcAreaObj.insertion.width = entry.$.width;
            srcAreaObj.insertion.sourceRef = {};
            srcAreaObj.insertion.sourceRef.deviceId = entry.SourceRef[0].$.deviceId;
            srcAreaObj.insertion.sourceRef.channelId = entry.SourceRef[0].$.channelId;
            retObj[srcAreaObj.id] = srcAreaObj;
        });
        return retObj;
    }

    function createLayoutObjectFromSourceArea(layoutName, layoutData) {
        var layout = {
            "title": layoutName,
            "Insertion" :[]
        };
        if (layoutData) {
            for (var id in layoutData) {
                var insert = layoutData[id].insertion;
                layout.Insertion.push({
                        "x": (insert.posX - $scope.canvasX)/$scope.canvasW,
                        "y": (insert.posY - $scope.canvasY)/$scope.canvasH,
                        "width": (insert.width/$scope.canvasW),
                        "height": (insert.height/$scope.canvasH),
                        "sourceRef": insert.sourceRef
                });
            }
        }
        $http.post('/api/layout', layout)
            .success(function (data, status, headers, config) {
                console.log("success while posting layout data");
            })
            .error(function (data, status, headers, config) {
                console.log("whoa server blew up");
            });

    }
});

layoutEditorApp.directive('source', function source() {

    return {
        restrict: "E",
        templateUrl: '../../views/source.html',
        replace: true,
        scope: {
            sourceData: '='
        },
        link: function (scope, elem, attr) {
            scope.sourceData.insertion.posX = elem[0].offsetLeft;
            scope.sourceData.insertion.posY = elem[0].offsetTop;
            scope.sourceData.insertion.width = elem[0].offsetWidth;
            scope.sourceData.insertion.height = elem[0].offsetHeight;
        },
        controller: function ($scope) {
            $scope.calcPosition = function (e) {
                $scope.sourceData.insertion.posX = e.target.offsetLeft;
                $scope.sourceData.insertion.posY = e.target.offsetTop;
                $scope.sourceData.insertion.width = e.target.offsetWidth;
                $scope.sourceData.insertion.height = e.target.offsetHeight;
            };
            $scope.openDialogWindow = function () {
                $scope.$root.activeObject = $scope.sourceData;
                $('#dialogWindow').dialog('open');
            };
        }
    };
});