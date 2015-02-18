'use strict';

layoutEditorApp.controller('MainCtrl', function ($scope, $http) {
    $scope.options = [
        {label: 'Change Layout', value: ''},
        {label: 'Create New Layout', value:{}}
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
    $scope.originX= ($(".parent")[0].offsetLeft)+2;
    $scope.originY= ($(".parent")[0].offsetTop)+2;
    $scope.$watch('activeObject', function (newVal) {
        if (newVal) {
            var id = '#' + newVal.id;
            $(id).offset({"top": newVal.insertion.posY, "left": newVal.insertion.posX})
                .outerWidth(newVal.insertion.width)
                .outerHeight(newVal.insertion.height);
        }
    }, true);
    $scope.addSourceArea = function () {
        var id = generateSrcAreaId();
        var srcArea = {
            id: id,
            insertion: {
                posX: "",
                posY: "",
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
    $scope.saveLayout = function () {
        console.dir($scope.layoutObject);
        console.dir($scope.layoutName);
    };

    /*util functions for backend data mapping*/

    function generateSrcAreaId(){
        return new Date().getTime();
    }
    function createSourceAreaFromLayoutData(insertionArr) {
        var retObj = {};
        insertionArr.forEach(function (entry) {
            var srcAreaObj = {};
            srcAreaObj.id = generateSrcAreaId();
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