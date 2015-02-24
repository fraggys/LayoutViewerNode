'use strict';

layoutEditorApp.controller('MainCtrl', function ($scope, $http) {

    $scope.options = [
        {label: 'Change Layout', text: '', value: ''},
        {label: 'Create New Layout', text: 'New Layout', value: {}}
    ];

    //get layout list from server
    $http.get('/api/layouts')
        .success(function (data, status, headers, config) {
            if (data) {
                data.forEach(function (layout) {
                    $scope.options.push({
                        label: layout.$.title,
                        text: layout.$.title,
                        value: createSourceAreaFromLayoutData(layout.Insertion)
                    });
                });
            }
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

    //keep parentElemDimensions in the scope
    var parentElem = $(".parent")[0];
    $scope.canvasW = (parentElem).offsetWidth;
    $scope.canvasH = (parentElem).offsetHeight;
    $scope.canvasX = parentElem.offsetLeft + 2;
    $scope.canvasY = parentElem.offsetTop + 2;

    $(".parent").contextmenu({
        delegate: ".source",
        menu: [
            {title: "Move to top", cmd: "copy", uiIcon: "ui-icon-arrowstop-1-n"},
            {title: "Move to bottom", cmd: "copy", uiIcon: "ui-icon-arrowstop-1-s"}
        ],
        select: function (event, ui) {
            alert("select " + ui.cmd + " on " + ui.target.text());
        },
        addClass: "top",
        beforeOpen: function (event, ui) {
        }
    });

    /*Dialog window controls and logic refactor to move out at later time.*/
    $scope.srcTypeOptions = [
        {label: 'Insertion', value: 'Insertion'},
        {label: 'Region', value: 'Region'}
    ];
    $scope.blinkSpeedOptions = [
        {label: 'None', value: 'None'},
        {label: 'Super Slow', value: 'superSlow'},
        {label: 'Slow', value: 'slow'},
        {label: 'Medium', value: 'medium'},
        {label: 'Fast', value: 'fast'},
        {label: 'Very Fast', value: 'veryFast'}
    ];

    $scope.$watch('layoutMaster.value[currentId]', function (newVal) {
        if (newVal) {
            var id = '#' + newVal.id;
            //calculate element dimensions from relative values
            $(id).css({
                top: newVal.insertion.posY + "px",
                left: newVal.insertion.posX + "px",
                width: newVal.insertion.width,
                height: newVal.insertion.height
            });
        }
    }, true);

    $scope.addSourceArea = function () {
        var id = generateUUId();
        var srcArea = {
            id: id,
            insertion: {
                type: "",
                posX: "",
                posY: "",
                width: "",
                height: "",
                zIndex: "",
                sourceRef: {
                    deviceId: "",
                    channelId: ""
                },
                border: {
                    thickness: "",
                    color: "",
                    blinkSpeed: $scope.blinkSpeedOptions[0].value
                },
                annotation: {
                    text: "",
                    size: 0,
                    font: {
                        wt: 0,
                        italic: false,
                        position: "",
                        color: "",
                        bgColor: ""
                    }
                }
            }
        };
        $scope.layoutMaster.value[id] = (srcArea);
    };

    $scope.saveLayout = function () {
        postLayoutDataAsForm($scope.layoutMaster.text, $scope.layoutMaster.value);
    };

    function generateUUId() {
        return new Date().getTime();
    }

    function createSourceAreaFromLayoutData(insertionArr) {
        var retObj = {};
        if (insertionArr) {
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
                retObj[srcAreaObj.id] = (srcAreaObj);
            });
        }
        return retObj;
    }

    function postLayoutDataAsForm(layoutName, layoutData) {
        var formData = new FormData();

        var layout = {
            "title": layoutName,
            "Insertion": []
        };
        if (layoutData) {
            for (var i = 0; i < layoutData.length; i += 1) {
                var insert = layoutData[i].insertion;
                var insertVO = {
                    "x": (insert.posX - $scope.canvasX) / $scope.canvasW,
                    "y": ($scope.canvasY + $scope.canvasH - insert.height - insert.posY) / $scope.canvasH,
                    "width": (insert.width / $scope.canvasW),
                    "height": (insert.height / $scope.canvasH),
                    "sourceRef": insert.sourceRef
                };
                var file = layoutData[i].bgImageFile;
                if (file) {
                    // layoutName as deviceId and UUID of src Area as channelId
                    var fieldName = layoutName + "_" + layoutData[i].id;
                    var fileName = file.name;
                    formData.append(fieldName, file, fileName);
                    insertVO["bgImgName"] = fieldName;
                    insertVO["bgImgExt"] = fileName.substring(fileName.lastIndexOf("."));
                }
                layout.Insertion.push(insertVO);
            }
        }
        formData.append("layout", JSON.stringify(layout));
        /* uploading blob is not supported in $http switching to AJAX only chrome pls */
        var request = new XMLHttpRequest();
        request.open("POST", "/api/layout");
        request.send(formData);
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
                $scope.$root.currentId = $scope.sourceData.id;
                $('#dialogWindow').dialog('open');
            };
        }
    };
});

layoutEditorApp.directive("fileReader", function () {
    return {
        restrict: "A",
        link: function ($scope, el) {
            el.bind("change", function (e) {
                if ((e.srcElement || e.target).files[0]) {
                    var elemId = "#" + $scope.currentId;
                    $scope.layoutMaster.value[$scope.currentId].bgImageFile = (e.srcElement || e.target).files[0];
                    $(elemId).css({
                        'background-image': 'url(' + URL.createObjectURL($scope.layoutMaster.value[$scope.currentId].bgImageFile) + ')',
                        'background-size': '100% 100%',
                        'background-color': 'transparent',
                        'background-repeat': 'no-repeat'
                    });
                }
            });
        }
    }
});
