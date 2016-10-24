var app = angular.module('app', ['appControllers','appServices','appFilters']);
var appControllers = angular.module('appControllers', []);
var appServices = angular.module('appServices', []);
var appFilters = angular.module('appFilters', []);

appControllers.controller('MainController', [ '$scope', function ($scope) {

  $scope.message = "Hello world !";

}]);
