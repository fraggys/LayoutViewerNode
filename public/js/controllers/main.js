'use strict';

layoutEditorApp.controller('MainCtrl', function ($scope) {
    $scope.options = [
        { label: 'Change Layout', value: '' }
    ];
    $scope.layoutName = $scope.options[0];

    $("#addBtn").button({
        icons:{
            primary:"ui-icon-plus"
        }
    });
    $("#saveBtn").button({
        icons: {
            primary: "ui-icon-disk"
        }
    });
    $scope.layoutObject = {};
    $scope.$watch('activeObject', function(newVal){
        if(newVal){
            var id = '#'+newVal.id;
            $(id).offset({"top":newVal.insertion.posY,"left":newVal.insertion.posX})
                 .outerWidth(newVal.insertion.width)
                 .outerHeight(newVal.insertion.height);
        }
    },true);
    $scope.addSourceArea = function () {
      var id = new Date().getTime();
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
        $scope.layoutObject[id]=srcArea;
    };
    $scope.saveLayout =  function () {
        console.dir($scope.layoutObject);
        console.dir($scope.layoutName);
    };
});

layoutEditorApp.directive('source', function source() {

    return {
        restrict: "E",
        templateUrl: '../../views/source.html',
        replace: true,
        scope: {
            sourceData: '='
        },
        link:function(scope,elem,attr){
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