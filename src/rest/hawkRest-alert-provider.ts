/**
 * @ngdoc provider
 * @name hawkular.rest.HawkularAlert
 * @description
 * # HawkularAlert
 * Provider in the hawkular.rest.
 */

module hawkularRest {

  _module.provider('HawkularAlert', function() {
    // time (in ms) the notifications are shown

    this.host = 'localhost';
    this.port = 8080;

    this.setHost = function(host) {
      this.host = host;
      return this;
    };

    this.setPort = function(port) {
      this.port = port;
      return this;
    };

    this.$get = ['$resource', function($resource) {

      var prefix = 'http://' + this.host + ':' + this.port;
      var factory: any = {};

      factory.Alert = $resource(prefix + '/hawkular/alerts', {

      }, {
        reload: {
          method: 'GET',
          url: prefix + '/hawkular/alerts/reload'
        }
      });

      factory.Trigger = $resource(prefix + '/hawkular/alerts/triggers/:triggerId', {
        triggerId: '@triggerId'
      }, {
        save: {
          method: 'POST',
          url: prefix + '/hawkular/alerts/triggers/'
        },
        put: {
          method: 'PUT'
        },
        conditions: {
          method: 'GET',
          url: prefix + '/hawkular/alerts/triggers/:triggerId/conditions',
          isArray: true,
          params: {
            triggerId: '@triggerId'
          }
        }
      });

      factory.Dampening = $resource(prefix + '/hawkular/alerts/trigger/dampening/:triggerId', {
        triggerId: '@triggerId'
      }, {
        save: {
          method: 'POST',
          url: prefix + '/hawkular/alerts/trigger/dampening/'
        },
        put: {
          method: 'PUT'
        }
      });

      factory.AvailabilityCondition = $resource(prefix + '/hawkular/alerts/conditions/availability/:conditionId', {
        conditionId: '@conditionId'
        }, {
          put: {
            method: 'PUT'
          },
          trigger: {
            method: 'GET',
            url: prefix + '/hawkular/alerts/conditions/availability/trigger/:triggerId',
            isArray: true,
            params: {
              triggerId: '@triggerId'
            }
          }
      });

      factory.CompareCondition = $resource(prefix + '/hawkular/alerts/conditions/compare/:conditionId', {
        conditionId: '@conditionId'
      }, {
        put: {
          method: 'PUT'
        },
        trigger: {
          method: 'GET',
          url: prefix + '/hawkular/alerts/conditions/compare/trigger/:triggerId',
          isArray: true,
          params: {
            triggerId: '@triggerId'
          }
        }
      });

      factory.StringCondition = $resource(prefix + '/hawkular/alerts/conditions/string/:conditionId', {
        conditionId: '@conditionId'
      }, {
        put: {
          method: 'PUT'
        },
        trigger: {
          method: 'GET',
          url: prefix + '/hawkular/alerts/conditions/string/trigger/:triggerId',
          isArray: true,
          params: {
            triggerId: '@triggerId'
          }
        }
      });

      factory.ThresholdCondition = $resource(prefix + '/hawkular/alerts/conditions/threshold/:conditionId', {
        conditionId: '@conditionId'
      }, {
        put: {
          method: 'PUT'
        },
        trigger: {
          method: 'GET',
          url: prefix + '/hawkular/alerts/conditions/threshold/trigger/:triggerId',
          isArray: true,
          params: {
            triggerId: '@triggerId'
          }
        }
      });

      factory.ThresholdRangeCondition = $resource(prefix + '/hawkular/alerts/conditions/range/:conditionId', {
        conditionId: '@conditionId'
      }, {
        put: {
          method: 'PUT'
        },
        trigger: {
          method: 'GET',
          url: prefix + '/hawkular/alerts/conditions/range/trigger/:triggerId',
          isArray: true,
          params: {
            triggerId: '@triggerId'
          }
        }
      });

      factory.NotifierType = $resource(prefix + '/hawkular/alerts/notifierType/:notifierType', {
        notifierType: '@notifierType'
      }, {
        get: {
          method: 'GET',
          isArray: true
        }
      });

      factory.Notifier = $resource(prefix + '/hawkular/alerts/notifiers/:notifierId', {
        notifierId: '@notifierId'
      }, {
        put: {
          method: 'PUT',
          url: prefix + '/hawkular/alerts/notifiers/:notifierId',
          params: {
            notifierId: '@notifierId'
          }
        },
        notifierType: {
          method: 'GET',
          isArray: true,
          url: prefix + '/hawkular/alerts/notifiers/type/:notifierType',
          params: {
            notifierType: '@notifierType'
          }
        }
      });

      return factory;
    }];

  });
}