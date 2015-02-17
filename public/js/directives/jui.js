/*global angular:true $:true*/
'use strict';
(function () {

    var components = {
        draggable: [
            'create',
            'start',
            'drag',
            'stop'
        ],
        'droppable': [
            'create',
            'activate',
            'deactivate',
            'over',
            'out'
        ],
        'resizable': [
            'create',
            'start',
            'resize',
            'stop'
        ],
        'dialog': [
            'beforeClose',
            'close',
            'create',
            'drag',
            'dragStart',
            'dragStop',
            'focus',
            'open',
            'resize',
            'resizeStart',
            'resizeStop'
        ]
    };

    /**
     * Updating String prototype to capitalize first letter
     * @return {String}
     */
    String.prototype.capitalize = function () {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }


    var getScopeDefinition = function (eventNames) {
        var scopeDefinition = {};

        eventNames.forEach(function (eventName) {
            scopeDefinition[eventName] = 'event' + eventName.capitalize();
        });

        return scopeDefinition;
    }

    var jui_module = angular.module('jui', []);

    angular.forEach(Object.keys(components), function (type) {
        var directiveName = 'jui' + type.capitalize()
        angular.module('jui')
            .directive(directiveName, ['$parse', function ($parse) {
                return {
                    'restrict': 'A',
                    'link': function (scope, element, attrs) {
                        var opts = angular.fromJson(attrs.juiOptions)[type] || {};
                        components[type].forEach(function (event) {
                            var handlerName = attrs['on' + event.capitalize()];
                            if (handlerName) {
                                var handlerExpr = $parse(handlerName);
                                    opts[event] = function (e, ui) {
                                        var phase = scope.$root.$$phase;
                                        e.element = element;

                                        if (phase === '$apply' || phase === '$digest') {
                                            callHandler();
                                        } else {
                                            scope.$apply(callHandler);
                                        }

                                        function callHandler() {
                                            var fn = handlerExpr(scope, {'$event': event});

                                            if (typeof fn === 'function') {
                                                fn.call(scope, e, ui);
                                            }
                                        }
                                    };
                                }
                        });
                        $(element)[type](opts);
                        var juiInstance = element.data('juiInstance');

                        if (!juiInstance) {
                            $(element)[type](opts);
                            element.data('juiInstance', true);
                            scope.$on('$destroy', function () {
                                $(element)[type]("destroy");
                            });
                        }
                    }
                };
            }]);
    });

}())

