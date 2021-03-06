///
/// Copyright 2015-2016 Red Hat, Inc. and/or its affiliates
/// and other contributors as indicated by the @author tags.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///    http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

/**
 * @ngdoc provider
 * @name hawkular.rest.HawkularInventory
 * @description
 * # HawkularInventory
 * Provider in the hawkular.rest.
 */

module hawkularRest {

  _module.constant('inventoryInterceptURLS',
      [new RegExp('.+/inventory/.+/resources/.+%2F.+', 'i'), new RegExp('.+/inventory/.+/resources/.+%252F.+', 'i')]);

  _module.config(['$httpProvider', 'inventoryInterceptURLS', function($httpProvider, inventoryInterceptURLS) {
    const SLASH = '/';

    const ENCODED_SLASH = '%2F';
    const ENCODED_SLASH_RE = new RegExp(ENCODED_SLASH, 'gi');

    const DOUBLE_ENCODED_SLASH = '%252F';
    const DOUBLE_ENCODED_SLASH_RE = new RegExp(DOUBLE_ENCODED_SLASH, 'gi');

    $httpProvider.interceptors.push(function ($q) {
      return {
        'request': function (config) {
          var url = config.url;

          for (var i = 0; i < inventoryInterceptURLS.length; i++) {

            if (url.match(inventoryInterceptURLS[i])) {
              // first step: %2F -> / ; second step: %252F -> %2F (the order is important here)
              url = url.replace(ENCODED_SLASH_RE, SLASH).replace(DOUBLE_ENCODED_SLASH_RE, ENCODED_SLASH);
              // end there is only one matching url
              break;
            }
          }

          config.url = url;
          return config || $q.when(config);
        }
      };
    });
  }]);


  _module.provider('HawkularInventory', function() {

    this.setProtocol = function(protocol) {
      this.protocol = protocol;
      return this;
    };

    this.setHost = function(host) {
      this.host = host;
      return this;
    };

    this.setPort = function(port) {
      this.port = port;
      return this;
    };

    this.$get = ['$resource', '$location', '$rootScope', '$log', function($resource, $location, $rootScope, $log) {

      // If available, used pre-configured values, otherwise use values from current browser location of fallback to
      // defaults
      this.setProtocol(this.protocol || $location.protocol() || 'http');
      this.setHost(this.host || $location.host() || 'localhost');
      this.setPort(this.port || $location.port() || 8080);

      const prefix = this.protocol + '://' + this.host + ':' + this.port;
      const inventoryUrlPart = '/hawkular/inventory';
      const url = prefix + inventoryUrlPart;
      const wsUrl = 'ws://' + this.host + ':' + this.port + inventoryUrlPart + '/ws/events';
      let factory: any = {};


      // helper methods for making the code DRY
      var relsActionFor = (url: String): Object => {
        return {
          method: 'GET',
          isArray: true,
          url: url + '/relationships'
        };
      };

      var createDataActions = (urlPrefix: String, defaultDataType: String): Object => {
        var urlForData = urlPrefix + '/data';
        return {
          relationships: relsActionFor(urlPrefix),
          getData: {
            method: 'GET',
            params: {dataType: defaultDataType},
            url: urlForData
          },
          createData: {
            method: 'POST',
            url: urlForData
          },
          updateData: {
            method: 'PUT',
            params: {dataType: defaultDataType},
          url: urlForData
          },
          deleteData: {
            method: 'DELETE',
            params: {dataType: defaultDataType},
            url: urlForData
          }
        };
      };

      var createResourceActions = (urlPrefix: String, defaultDataType: String): Object => {
        var dataActions = createDataActions(urlPrefix, defaultDataType);
        dataActions['getChildren'] = {
          method: 'GET',
          isArray: true,
          url: urlPrefix + '/children'
        };
        dataActions['getParents'] = {
          method: 'GET',
          isArray: true,
          url: urlPrefix + '/parents'
        };
        dataActions['getParent'] = {
          method: 'GET',
          url: urlPrefix + '/parent'
        };
        dataActions['getMetrics'] = {
          method: 'GET',
          url: urlPrefix + '/metrics'
        };
        dataActions['updateProperties'] = {
          method: 'PUT',
          url: urlPrefix
        };
        return dataActions;
      };

      // ngResources
      // Often there are X and XUnderFeed variants, this is because of the fact that inventory
      // allows to store the entities in the graph db either under the environment or under the feed
      // that is also under the environment. In a way, entities under the feeds allow for finer grade
      // structure, while things stored under environment are more suitable for things shared across
      // multiple feeds (note: name must be unique within the parent node (feed/environment)).

      // Tenants CRUD
      factory.Tenant = $resource(url + '/tenant', {
        put: {
          method: 'PUT'
        }
      });

      // Environments CRUD
      var environmentUrl = url + '/environments/:environmentId';
      factory.Environment = $resource(environmentUrl, null, {
        put: {
          method: 'PUT'
        },
        relationships: relsActionFor(environmentUrl)
      });

      // Feeds CRUD
      var feedUrl = url + '/feeds/:feedId';
      factory.Feed = $resource(feedUrl, null, {
        put: {
          method: 'PUT'
        },
        relationships: relsActionFor(feedUrl)
      });

      // Resources CRUD
      var resourceUrl = url + '/:environmentId/resources/:resourcePath';
      factory.Resource = $resource(resourceUrl, null, createResourceActions(resourceUrl, 'configuration'));

      // Resources located under the feed CRUD
      var feedResourceUrl = url + '/feeds/:feedId/resources/:resourcePath';
      factory.ResourceUnderFeed = $resource(feedResourceUrl, null,
        createResourceActions(feedResourceUrl, 'configuration'));

      // Resources Types
      var resourceTypeUrl = url + '/resourceTypes/:resourceTypeId';
      factory.ResourceType = $resource(resourceTypeUrl, null,
        createDataActions(resourceTypeUrl, 'configurationSchema'));

      var feedResourceTypeUrl = url + '/feeds/:feedId/resourceTypes/:resourceTypeId';
      factory.ResourceTypeUnderFeed = $resource(feedResourceTypeUrl, null,
        createDataActions(feedResourceTypeUrl, 'configurationSchema'));

      // Metric Types
      var metricTypeUrl = url + '/metricTypes/:metricTypeId';
      factory.MetricType = $resource(metricTypeUrl, null, {
        put: {
          method: 'PUT'
        },
        relationships: relsActionFor(metricTypeUrl)
      });

      var feedMetricTypeUrl = url + '/feeds/:feedId/metricTypes/:metricTypeId';
      factory.MetricTypeUnderFeed = $resource(feedMetricTypeUrl, null, {
        put: {
          method: 'PUT'
        },
        relationships: relsActionFor(feedMetricTypeUrl)
      });

      // Metrics belonging to given resource
      var resourceMetricUrl = url + '/:environmentId/resources/:resourcePath/metrics/:metricId';
      factory.MetricOfResource = $resource(resourceMetricUrl, null, {
        put: {
          method: 'PUT'
        }
      });

      var feedResourceMetricUrl = url + '/feeds/:feedId/resources/:resourcePath/metrics/:metricId';
      factory.MetricOfResourceUnderFeed = $resource(feedResourceMetricUrl, null, {
        put: {
          method: 'PUT'
        },
        'get':  {
          method:'GET',
          isArray:true
        }
      });

      // Metric types belonging to a given resource type
      var metricTypeOfResourceTypeUrl = url + '/resourceTypes/:resourceTypeId/metricTypes/:metricTypeId';
      factory.MetricTypeOfResourceType = $resource(metricTypeOfResourceTypeUrl, null, {
        relationships: relsActionFor(metricTypeOfResourceTypeUrl)
      });

      var feedMetricTypeOfResourceTypeUrl =
        url + '/feeds/:feedId/resourceTypes/:resourceTypeId/metricTypes/:metricTypeId';
      factory.MetricTypeOfResourceTypeUnderFeed = $resource(feedMetricTypeOfResourceTypeUrl, null, {
        relationships: relsActionFor(feedMetricTypeOfResourceTypeUrl)
      });

      // Resources of a given type
      factory.ResourceOfType = $resource(url + '/resourceTypes/:resourceTypeId/resources');
      factory.ResourceOfTypeUnderFeed =
        $resource(url + '/feeds/:feedId/resourceTypes/:resourceTypeId/resources');

      // Returns all the resources under the resource given by the :resourcePath respecting the resource hierarchy
      // ?typeId=fooResourceType query param can be used
      factory.ResourceRecursiveChildren = $resource(url + '/:environmentId/resources/:resourcePath/recursiveChildren');

      // same as ^ but it's for the resources under the feed additional optional query param called 'feedlessType'
      // can be used. It denotes whether to use the resource type located under the env (true) or not which is default
      factory.ResourceRecursiveChildrenUnderFeed =
      $resource(url + '/feeds/:feedId/resources/:resourcePath/recursiveChildren', null, {
        'get':  {
          method:'GET',
          isArray:true
        }
      });

      // Metrics
      var metricUrl = url + '/:environmentId/metrics/:metricId';
      factory.Metric = $resource(metricUrl, null, {
        put: {
          method: 'PUT'
        },
        relationships: relsActionFor(metricUrl)
      });

      var feedMetricUrl = url + '/feeds/:feedId/metrics/:metricId';
      factory.MetricUnderFeed = $resource(feedMetricUrl, null, {
        put: {
          method: 'PUT'
        },
        relationships: relsActionFor(feedMetricUrl)
      });

      // Get whole graph (read-only)
      factory.Graph = $resource(url + '/graph');

      // Listen to inventory events
      factory.Events = (tenantId) => {
        return {
          listen: (handler: IWebSocketHandler) => {
            const ws = new WebSocket(wsUrl + `?tenantId=${tenantId}`);

            ws.onmessage = (event) => {
              const eventData = JSON.parse(event.data);
              if (handler && handler.onmessage) {
                handler.onmessage(eventData);
              } else {
                $log.log('ws: received event');
                $log.log(eventData);
              }
            };

            ws.onopen = (handler && handler.onopen) || ((event) => $log.log('ws: Listening on inventory events..'));

            ws.onclose = (handler && handler.onclose) || ((event) => {
              $log.warn('ws: Stop listening on inventory events.');
              $rootScope.$broadcast('WebSocketClosed', event.reason);
            });

            ws.onerror = (handler && handler.onerror) || ((event) => $log.log('ws: Error: ' + event));
          }
        };
      };

      return factory;
    }];

  });
}
