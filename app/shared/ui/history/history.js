angular.module("beatbox")
	.directive("bbHistory", function() {
		return {
			templateUrl: "app/shared/ui/history/history.html",
			controller: "bbHistoryController",
			scope: { },
			replace: true
		};
	})
	.controller("bbHistoryController", function($scope, bbHistory) {
		$scope.bbHistory = bbHistory;

		$scope.getHistoryKeyTitle = function(key) {
			return new Date(key*1000).toISOString();
		};
	});