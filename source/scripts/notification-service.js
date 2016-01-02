/**
 * noficication-service
 * @author alexsabdev (alexsabdev@gmail.com)
 * @version v1.0.0
 * @link https://github.com/alexsabdev/notification-service.git
 */
 var nsModule = angular.module('notification-service', []);
/**
* @ngdoc service
* @name notification-service.service:Notification
* @description 
*
* notification-service - Angular.js service providing notifications using Bootstrap 3 styles with css transition animation. It creates overlay notifications on window. Number of notifications is limited by options.limit. When the limit is reached, the oldest notification temporary gets off from screen and the latest pops up. And after that gets back when there's a free spot. Created notifications are closable by clicking. They are also selfclosed within period of options.delay.
* <strong>Checkout README.MD for detailed instructions!</strong>
* 
*/
nsModule.service('Notification', ['$rootScope', '$compile', '$http', function($rootScope, $compile, $http){
	// scope for the service
	var scope = $rootScope.$new();
	// object for the service options
	scope.options = {
		delay: 90000,
		limit: 5,
		baseUrl: 'http://localhost:3000/'
	};
	// array to keep track of incoming alerts
	scope.buffer = [];
	// variable to keep track if the notification area is displayed or not
	scope.isDisplayed = false;
	// procedure to kill the alert
	scope.kill = function(item) {
		scope.buffer.splice(scope.buffer.indexOf(item), 1);
		if (scope.buffer.length === 0) {
			scope.isDisplayed = false;
			angular.element(document.getElementById('notification-area')).remove();
		}
	};
	// procedure to send the user response
	scope.sendResponse = function(item, answer) {
		console.log(item);
		$http({
			url: scope.options.baseUrl + 'confirm',
			method: "POST",
			data: {
				'id': item.id,
				'from': item.from,
				'result': answer
			}
		})
		.then(function(response) {
			console.log('POST success');
		},
		function(response) {
			console.log('POST error');
		});
		scope.kill(item);
	};
	// procedure to set new options
	this.setOptions = function(opts) {
		if (!angular.isObject(opts)) throw new Error("Options should be an object!");
		scope.options = angular.extend({}, scope.options, opts);
	};
	// template for notifications
	var template =
			'<ul id="notification-area">' +
			'<li id="ns-{{item.id}}" class="ns-alert-{{item.category}} notification" ng-repeat="item in buffer|limitTo:-options.limit">' +
			'<span class="ns-close" ng-click="kill(item)">&times;</span>' +
			'<p class="ns-title"><strong>ID {{item.id}}: {{item.header}}</strong></p>' +
			'<p class="ns-content">{{ item.content }}</p>' +
			'<button class="ns-btn ns-btn-xs ns-btn-{{item.category}}" ng-show="item.type!==\'note\'" ng-click="sendResponse(item,1)">OK</button>' +
			'<button class="ns-btn ns-btn-xs ns-btn-{{item.category}}" ng-show="(item.type!==\'note\')&&(item.type!==\'ok_confirm\')" ng-click="sendResponse(item,0)">Cancel</button>' +
			'</li></ul>';
	// procedure to air the alert
	this.notify = function(note) {
		scope.buffer.push(note);
		if (!scope.isDisplayed) {
			angular.element(document.getElementsByTagName('body')).append($compile(template)(scope));
			scope.isDisplayed = true;
		}
		window.setTimeout(function() {
			var toKill = angular.element(document.getElementById('ns-' + note.id))[0];
			if (toKill) {
				toKill.remove();
				scope.buffer.splice(scope.buffer.indexOf(note),1);
			}
		},scope.options.delay);
	};
	this.getFromServer = function() {
		$http({
			url: scope.options.baseUrl + 'list',
			method: "GET",
		})
		.then(function(response) {
			console.log('GET success');
			var noteArray = response.data;
			for (var i = 0; i < noteArray.length; i++)
				scope.buffer.push(noteArray[i]);
			if (!scope.isDisplayed) {
				angular.element(document.getElementsByTagName('body')).append($compile(template)(scope));
				scope.isDisplayed = true;
			}
		},
		function(response) {
			console.log('GET error');
		});
};
}]);