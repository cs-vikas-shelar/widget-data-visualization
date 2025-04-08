/* Copyright start
  MIT License
  Copyright (c) 2025 Fortinet Inc
  Copyright end */
'use strict';

(function () {
    angular
        .module('cybersponse')
        .factory('dataVisualizationService', dataVisualizationService);

    dataVisualizationService.$inject = ['$q', '$http', 'Query', 'API', 'ALL_RECORDS_SIZE', 'WIDGET_BASE_PATH', 'dataVisualization_VIZ_MAP_TYPES', '_', '$state'];

    function dataVisualizationService($q, $http, Query, API, ALL_RECORDS_SIZE, WIDGET_BASE_PATH, dataVisualization_VIZ_MAP_TYPES, _, $state) {
        var service;
        var config;
        var fileCount = 0;
        var fileLoadDefer = $q.defer();

        service = {
            loadJs: loadJs,
            loadVisualizationType: loadVisualizationType,
            fetchLiveData: fetchLiveData,
            fetchStaticData: fetchStaticData,
            redirectToModuleListing: redirectToModuleListing,
        };

        // Load CDN JS files
        function loadJs(fileList) {
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = fileList[fileCount];
            document.getElementsByTagName('head')[0].appendChild(script);
            script.onload = function () {
                if (fileCount === fileList.length - 1) {
                    fileLoadDefer.resolve();
                } else {
                    fileCount++;
                    loadJs(fileList).then(function () {
                    });
                }
            }
            return fileLoadDefer.promise;
        }

        function fetchStaticData(_config) {
            config = _config;
            let resource = config.resource;
            var defer = $q.defer();
            var queryObject = {};
            let dataFilters = config.query.filters ? angular.copy(config.query.filters) : {};
            queryObject['filters'] = dataFilters;
            var _queryObj = new Query(queryObject);
            $http.post(API.QUERY + resource + '?$limit=30', _queryObj.getQuery(true)).then(function (response) {
                defer.resolve(response.data);
            }, function (error) {
                defer.reject(error);
            });

            return defer.promise;
        }

        function _getObjectUuid(availableOptions, data, field) {
            return _.pluck(_.filter(availableOptions[field], (option) => { return option.itemValue === data }), 'uuid');
        }

        // TODO: Generic operations to handle LookUp filters
        function _loadLookupRecordUuid(moduleName) {
            return $http.get(`${API.API_3_BASE}${moduleName}`);
        }

        function _createFilter(config, params, availableOptions, tenantList) {
            let query = new Query();
            let widgetQuery = new Query();
            switch(params.seriesType) {
                case dataVisualization_VIZ_MAP_TYPES.SUNBURST:
                case dataVisualization_VIZ_MAP_TYPES.TREE_MAP: 
                {
                    let dataValues = params.name.split(' > ');
                    dataValues.forEach((data, index) => {
                        if (_.contains(['picklist'], config.sunTree.mappingLevel[index].type)) {
                            widgetQuery.filters.push({
                                field: config.sunTree.mappingLevel[index].name,
                                type: config.sunTree.mappingLevel[index].type,
                                operator: 'in',
                                value: _getObjectUuid(availableOptions, data, config.sunTree.mappingLevel[index].name)
                            });
                        } else {
                            widgetQuery.filters.push({
                                field: config.sunTree.mappingLevel[index].name,
                                operator: 'eq',
                                value: _.pick(_.filter(tenantList, (tenant) => { return tenant.name === data })[0], 'uuid').uuid
                            });
                        }
                    });
                }
                    break;
            }
            query.widgetQuery = widgetQuery;
            $state.go('main.modules.list', {
                module: config.resource,
                query: encodeURIComponent(JSON.stringify(query))
            });
        }

        function redirectToModuleListing(config, params, fields) {
            let availableOptions = {};
            let isLookUpAvailable = false;
            (config.sunTree.mappingLevel).forEach((mapLevel) => {
                if ((['picklist']).indexOf(fields[mapLevel.name].type) > -1) {
                    availableOptions[mapLevel.name] = fields[mapLevel.name].options;
                } else {
                    isLookUpAvailable = true;
                }
            });
            if (isLookUpAvailable) {
                _loadLookupRecordUuid('tenants').then(function(lookUpData) {
                    _createFilter(config, params, availableOptions, lookUpData.data['hydra:member']);
                });
            } else {
                _createFilter(config, params, availableOptions);
            }
        }

        function fetchLiveData(_config) {
            config = _config;
            let resource = config.resource;
            var defer = $q.defer();

            var queryObject = {
                sort: [],
                aggregates: [],
                relationship: true
            };

            switch (config.vizType) {
                case dataVisualization_VIZ_MAP_TYPES.SUNBURST:
                case dataVisualization_VIZ_MAP_TYPES.TREE_MAP: 
                {
                    if (['picklist'].indexOf(config.sunTree.mappingLevel[0].type) > -1) {
                        queryObject.sort.push({
                            field: config.sunTree.mappingLevel[0].name + '.orderIndex',
                            direction: 'ASC'
                        });
                        queryObject.aggregates.push({
                            operator: 'groupby',
                            alias: 'orderIndex',
                            field: config.sunTree.mappingLevel[0].name + '.orderIndex'
                        });
                        queryObject.aggregates.push({
                            operator: 'groupby',
                            alias: config.sunTree.mappingLevel[0].name + 'Color',
                            field: config.sunTree.mappingLevel[0].name + '.color'
                        });
                    }
                    queryObject.aggregates.push({
                        operator: 'count',
                        field: '*',
                        alias: 'total'
                    });
                    (config.sunTree.mappingLevel).forEach((level) => {
                        queryObject.aggregates.push({
                            operator: 'groupby',
                            alias: level.name,
                            field: level.name + (['picklist'].indexOf(level.type) > -1 ? '.itemValue' : '.name')
                        });
                    });
                }
                    break;
                case dataVisualization_VIZ_MAP_TYPES.WORD_CLOUD:
                    {
                        queryObject.aggregates.push({
                            operator: 'count',
                            field: '*',
                            alias: 'value'
                        });
                        queryObject.aggregates.push({
                            operator: 'groupby',
                            alias: 'name',
                            field: config.wordCloud.wordSource.name + (['picklist'].indexOf(config.wordCloud.wordSource.type) > -1 ? '.itemValue' : '')
                        });
                    }
                    break;
                case dataVisualization_VIZ_MAP_TYPES.HEAT_MAP:
                    {
                        let yAxisSortingAdded = false;
                        if ([config.heatMap.xAxis.field.type, config.heatMap.yAxis.field.type].indexOf('datetime') === 1) {
                            queryObject.sort.push({
                                field: config.heatMap.yAxis.field.name,
                                direction: 'ASC'
                            });
                            yAxisSortingAdded = true;
                        }
                        if (['picklist'].indexOf(config.heatMap.xAxis.field.type) > -1) {
                            queryObject.sort.push({
                                field: config.heatMap.xAxis.field.name + '.orderIndex',
                                direction: 'ASC'
                            });
                            queryObject.aggregates.push({
                                operator: 'groupby',
                                alias: 'orderIndex',
                                field: config.heatMap.xAxis.field.name + '.orderIndex'
                            });
                        } else {
                            queryObject.sort.push({
                                field: config.heatMap.xAxis.field.name,
                                direction: 'ASC'
                            });
                        } 
                        if (['picklist'].indexOf(config.heatMap.yAxis.field.type) > -1) {
                            queryObject.sort.push({
                                field: config.heatMap.yAxis.field.name + '.orderIndex',
                                direction: 'ASC'
                            });
                            queryObject.aggregates.push({
                                operator: 'groupby',
                                alias: 'orderIndex',
                                field: config.heatMap.yAxis.field.name + '.orderIndex'
                            });
                        } else if (!yAxisSortingAdded) {
                            queryObject.sort.push({
                                field: config.heatMap.yAxis.field.name,
                                direction: 'ASC'
                            });
                        }
                        queryObject.aggregates.push({
                            operator: 'count',
                            field: '*',
                            alias: 'total'
                        });
                        queryObject.aggregates.push({
                            operator: 'groupby',
                            alias: config.heatMap.xAxis.field.name,
                            field: config.heatMap.xAxis.field.name + (['picklist'].indexOf(config.heatMap.xAxis.field.type) > -1 ? '.itemValue' : '')
                        });
                        queryObject.aggregates.push({
                            operator: 'groupby',
                            alias: config.heatMap.yAxis.field.name,
                            field: config.heatMap.yAxis.field.name + (['picklist'].indexOf(config.heatMap.yAxis.field.type) > -1 ? '.itemValue' : '')
                        });
                    }
                    break;
            }

            let dataFilters = config.query.filters ? angular.copy(config.query.filters) : {};
            queryObject['filters'] = dataFilters;
            var _queryObj = new Query(queryObject);
            $http.post(`${API.QUERY}${resource}?$limit=${ALL_RECORDS_SIZE}`, _queryObj.getQuery(true)).then(function (response) {
                defer.resolve(response.data);
            }, function (error) {
                defer.reject(error);
            });

            return defer.promise;
        }

        function loadVisualizationType() {
            return $http.get(`${WIDGET_BASE_PATH.INSTALLED}dataVisualization-1.0.0/widgetAssets/json/vizTypes.json`);
        }

        return service;
    }
})();
