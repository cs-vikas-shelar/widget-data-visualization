/* Copyright start 
  MIT License 
  Copyright (c) 2025 Fortinet Inc 
  Copyright end */
'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('dataVisualization100Ctrl', dataVisualization100Ctrl);

  dataVisualization100Ctrl.$inject = ['$scope', 'widgetUtilityService', 'config', '$timeout', 'dataVisualizationService', 'Entity', 'dataVisualization_VIZ_MAP_TYPES', '$rootScope', '_', 'dataVisualization_VIZ_TYPES', 'CommonUtils'];

  function dataVisualization100Ctrl($scope, widgetUtilityService, config, $timeout, dataVisualizationService, Entity, dataVisualization_VIZ_MAP_TYPES, $rootScope, _, dataVisualization_VIZ_TYPES, CommonUtils) {

    $scope.config = config;
    var _config = angular.copy(config);
    $scope.themeId = $rootScope.theme.id;
    var entity = new Entity($scope.config.resource);
    var resourceName;

    function _handleTranslations() {
      widgetUtilityService.checkTranslationMode($scope.$parent.model.type).then(function () {
        $scope.viewWidgetVars = {
          // Create your translating static string variables here
          MSG_NO_RESULTS: widgetUtilityService.translate('dataVisualization.MSG_NO_RESULTS'),
          MSG_LOADING: widgetUtilityService.translate('dataVisualization.MSG_LOADING'),
        };
      });
    }

    function _loadingScreen() {
      $scope.myChart.showLoading('default', {
        text: $scope.viewWidgetVars.MSG_LOADING,
        color: 'light' === $scope.themeId ? '#4d74af' : '#1b2430', 
        textColor: 'light' === $scope.themeId ? '#000' : '#FFF',
        maskColor: 'light' === $scope.themeId ? 'rgba(255, 255, 255, 0.8)' : 'rgba(51, 59, 71, 1)',
        zlevel: 0,
      
        // Font size. Available since `v4.8.0`.
        fontSize: 12,
        // Show an animated "spinner" or not. Available since `v4.8.0`.
        showSpinner: true,
        // Radius of the "spinner". Available since `v4.8.0`.
        spinnerRadius: 10,
        // Line width of the "spinner". Available since `v4.8.0`.
        lineWidth: 5,
        // Font thick weight. Available since `v5.0.1`.
        fontWeight: 'normal',
        // Font style. Available since `v5.0.1`.
        fontStyle: 'normal',
        // Font family. Available since `v5.0.1`.
        fontFamily: 'sans-serif'
      });
    }

    function initializeChart() {
      $scope.height = angular.element(document.getElementById('eChart-' + $scope.config.wid))[0].clientWidth;
      angular.element(document.getElementById('eChart-' + $scope.config.wid)).attr('style', 'position: relative; max-height: 700px; height:' + $scope.height + 'px;');
      // Dispose already rendered chart if available
      $scope.myChart && echarts.dispose($scope.myChart);
      $scope.chartDom = angular.element(document.getElementById('eChart-' + $scope.config.wid))[0];
      $scope.myChart = echarts.init($scope.chartDom, ('light' === $scope.themeId) ? null : 'dark', {
        renderer: 'canvas',
        useDirtyRect: false
      });
      _loadingScreen();
      $scope.option = undefined;
      if (dataVisualization_VIZ_TYPES.ACROSS === $scope.config.moduleType && _.contains([dataVisualization_VIZ_MAP_TYPES.SUNBURST, dataVisualization_VIZ_MAP_TYPES.TREE_MAP], $scope.config.vizType)) {
        $scope.myChart.on('click', function(params) {
          if (params.name.split(' > ').length === 3) {
            dataVisualizationService.redirectToModuleListing($scope.config, params, $scope.fields);
          }
        });
      }
      setFilter();
      if ($scope.config.moduleType === dataVisualization_VIZ_TYPES.SINGLE) {
        processStaticChartData();
      } else {
        processLiveChartData();
      }
    }

    function _renderNoRecordMessage() {
      $scope.hideChartCanvas = true;
      $scope.myChart && echarts.dispose($scope.myChart);
    }

    function processLiveChartData() {
      dataVisualizationService.fetchLiveData(_config).then(function (result) {
        if (result && result['hydra:member']) {
          if (result['hydra:member'].length === 0) {
            _renderNoRecordMessage();
          }
          else {
            formMapData(result['hydra:member']);
          }
        }
      }).catch(function(error) {
        console.log(error);
      }).finally(function() {
        $scope.myChart.hideLoading();
      });
    }

    function processStaticChartData() {
      dataVisualizationService.fetchStaticData(_config).then(function (result) {
        if (result && result['hydra:member']) {
          if (result['hydra:member'].length === 0) {
            _renderNoRecordMessage();
          }
          else {
            var data = result['hydra:member'][0][$scope.config.objectField];
            if (!data) {
              data = {};
            } else {
              renderSelectedChart(data);
            }
          }
        }
      }).catch(function(error) {
        console.log(error);
      }).finally(function() {
        $scope.myChart.hideLoading();
      });
    }
    /*
     * This method create filter JSON as per selection in configuration to send
     * as a part of request payload.
     */
    var setFilter = function () {
      _config = angular.copy(config);
      var selfFilter = '';
      if ($scope.filterByAssignedToPerson && $scope.filterByMe) {
        selfFilter = {
          field: config.mapping.assignedToPerson,
          operator: 'eq',
          value: localStorageService.get(API.API_3_BASE + API.CURRENT_ACTOR)
        };
      }
      if (config.query.logic === 'OR') {
        _config.query.logic = 'AND';
        _config.query.filters = [];
        if (selfFilter !== '') {
          _config.query.filters.push(selfFilter);
        }
        _config.query.filters.push({
          logic: config.query.logic,
          filters: config.query.filters
        });
      }
      else {
        if (selfFilter !== '') {
          _config.query.filters.push(selfFilter);
        }
      }
    };

    function _hexToRGBA(hex, alpha) {
      // Remove # if present
      hex = hex.replace(/^#/, '');
  
      // Parse hex into RGB values
      let r = parseInt(hex.substring(0, 2), 16);
      let g = parseInt(hex.substring(2, 4), 16);
      let b = parseInt(hex.substring(4, 6), 16);

      if (alpha < 0) {
        r = (1 + alpha) * r;
        g = (1 + alpha) * g;
        b = (1 + alpha) * b;
      } else {
        r = (1 - alpha) * r + alpha * 255;
        g = (1 - alpha) * g + alpha * 255;
        b = (1 - alpha) * b + alpha * 255;
      }
  
      return `rgba(${r}, ${g}, ${b})`;
    }

    function _createNestedObject(obj, record, keys) {
      let current = obj;
      let alpha = 0;
      for (const key of keys) {
        if (!current[record[key]]) {
          current[record[key]] = {};
        }
        current[record[key]]['$count'] = current[record[key]]['$count'] ? current[record[key]]['$count'] + record.total : record.total;
        current = current[record[key]]; 
        if (!CommonUtils.isUndefined(record[keys[0] + 'Color'])) {
          current['$itemStyle'] = {
            color: _hexToRGBA(record[keys[0] + 'Color'], alpha)
          };
          alpha += 0.2;
        }
      }
      return obj;
    }

    function formMapData(data) {
      const inputJSON = {
        'mapData': data
      }

      let formedData;
      if (([dataVisualization_VIZ_MAP_TYPES.WORD_CLOUD, dataVisualization_VIZ_MAP_TYPES.HEAT_MAP].indexOf(config.vizType) > -1) || (dataVisualization_VIZ_TYPES.SINGLE === _config.moduleType)) {
         formedData = data;
      } else {
        // Form Data for Map Rendering
        let levelKeys = _.pluck($scope.config.sunTree.mappingLevel, 'name');
        formedData = inputJSON.mapData.reduce((obj, record) => {
          obj = _createNestedObject(obj, record, levelKeys);

          return obj;
        }, {});
      }

      renderSelectedChart(formedData);
    }

    function convert(source, target, basePath) {
      for (let key in source) {
        let path = basePath ? basePath + ' > ' + key : key;
        if (!key.match(/^\$/)) {
          target.children = target.children || [];
          const child = {
            name: path
          };
          target.children.push(child);
          convert(source[key], child, path);
        } else {
          target.value = source.$count || 0;
          target.itemStyle = source.$itemStyle;
        }
      }
      if (!target.children) {
        target.value = source.$count || 0;
        target.itemStyle = source.$itemStyle;
      }
      else if ($scope.config.vizType === dataVisualization_VIZ_MAP_TYPES.TREE_MAP) {
       target.children.push({
        name: basePath,
        value: source.$count,
        itemStyle: source.$itemStyle
      });
      }
    }

    function _tooltipRenderer(info, levelLabels) {
      let segmentValue = info.value;
      let levelValues = (!CommonUtils.isUndefined(info.name) && info.name.length !== 0) ? info.name.split(' > ') : [];
      let basicTemplateArray = [`
        <div class='display-flex'>
          <div class='margin-right-25'>
            <div class='tooltip-title font-size-16 font-bolder padding-bottom-sm'>${resourceName}</div>
            <div>`];
      if (levelValues.length > 0) {
        levelValues.forEach(function (value, index) {
          basicTemplateArray.push(`${levelLabels[index]}: ${value}<br/>`);
        });
      }
      basicTemplateArray.push(`</div></div>`);
      basicTemplateArray.push(`
        <div>
          <div class='font-size-10 font-italic padding-bottom-sm'>${widgetUtilityService.translate('dataVisualization.LABEL_TOTAL')}</div>
          <div class="font-size-25 font-bolder"> ${segmentValue}</div>
        </div>
      </div>`);
      return basicTemplateArray.join('');
    }

    function renderSunburst(rawData) {
      const data = {
        children: []
      };
      let levelLabels;
      if (dataVisualization_VIZ_TYPES.ACROSS === _config.moduleType) {
        convert(rawData, data, '');
        data.children = data.children.filter(children => children.name !== '');
        let mappingArray = _.pluck($scope.config.sunTree.mappingLevel, 'name');
        levelLabels = _.pluck(_.filter($scope.fields, function(field) {
          return (mappingArray).indexOf(field.name) > -1;
        }).sort((a, b) => mappingArray.indexOf(a.name) - mappingArray.indexOf(b.name)), 'title');
      } else {
        data.children = rawData.children;
      }
      $scope.option = {
        textStyle: {
          overflow: 'break'
        },
        tooltip: {
          formatter: function (info) {
            if (dataVisualization_VIZ_TYPES.ACROSS === _config.moduleType) {
              return _tooltipRenderer(info, levelLabels);
            } else {
              return `<i class="fa fa-circle padding-right-sm" style="color: ${info.color};"></i>${info.name} <span class="padding-left-md">${info.value}</span>`;
            }
          },
          position: 'inside',
          renderMode: 'html',
          backgroundColor: 'light' === $scope.themeId ? 'rgba(236, 232, 232, 0.8)' : 'rgba(0, 0, 0, 0.8)',
          borderColor: 'rgba(0, 0, 0, 1)',
          borderWidth: 1,
          textStyle: {
            color: 'light' === $scope.themeId ? 'rgba(0, 0, 0, 0.8)' : 'rgba(236, 232, 232, 0.8)'
          }
        },
        series: {
          type: 'sunburst',
          height: '80%',
          width: '80%',
          data: data.children,
          clockwise: true,
          label: {
            rotate: 'tangential', // 'tangential', // 'radial'
            formatter: '{b}\n\n{c}',
            //position: 'inside',
            width: 30,
            overflow: 'truncate', // 'brake',
            ellipsis: '..',
            minMargin: 5,
            // color: ('light' === $scope.themeId) ? '#000' : '#fff',
            minAngle: '10' // If the data is less than 10 deg then it doesn't show text
          },
          labelLayout: { hideOverlap: true },
          // emphasis: {
          //   label: {
          //     formatter: '\n{b}\n\n{c}'
          //   }
          // },
          // downplay: {
          //   label: {
          //     formatter: '\n{b}\n\n{c}'
          //   }
          // }
        }
      };

      $scope.option && $scope.myChart.setOption($scope.option);
    }

    function renderTreemapData(rawData) {
      const data = {
        children: []
      };
      let levelLabels;
      if (dataVisualization_VIZ_TYPES.ACROSS === _config.moduleType) {
        convert(rawData, data, '');
        data.children = data.children.filter(children => children.name !== '');
        let mappingArray = _.pluck($scope.config.sunTree.mappingLevel, 'name');
        levelLabels = _.pluck(_.filter($scope.fields, function(field) {
          return (mappingArray).indexOf(field.name) > -1;
        }).sort((a, b) => mappingArray.indexOf(a.name) - mappingArray.indexOf(b.name)), 'title');
      } else {
        data.children = rawData.children;
      }
      $scope.myChart.setOption(
        ($scope.option = {
          tooltip: {
            formatter: function (info) {
              if (dataVisualization_VIZ_TYPES.ACROSS === _config.moduleType) {
                return _tooltipRenderer(info, levelLabels);
              } else {
                return `<i class="fa fa-circle padding-right-sm" style="color: ${info.color};"></i>${info.name} <span class="padding-left-md">${info.value}</span>`;
              }
            },
            position: 'inside',
            renderMode: 'html',
            backgroundColor: 'light' === $scope.themeId ? 'rgba(236, 232, 232, 0.8)' : 'rgba(0, 0, 0, 0.8)',
            borderColor: 'rgba(0, 0, 0, 1)',
            borderWidth: 1,
            textStyle: {
              color: 'light' === $scope.themeId ? 'rgba(0, 0, 0, 0.8)' : 'rgba(236, 232, 232, 0.8)'
            }
          },
          breadcrumb: {
            itemStyle: {
              textStyle: {
                width: '150',
                overflow: 'truncate',
                ellipsis: '..'
              }
            }
          },
          series: [
            {
              name: 'Base',
              type: 'treemap',
              visibleMin: 300,
              roam: false,
              data: data.children,
              leafDepth: 2,
              levels: [
                {
                  itemStyle: {
                    borderColor: '#555',
                    borderWidth: 2,
                    gapWidth: 4
                  }
                },
                {
                  colorSaturation: [0.3, 0.6],
                  itemStyle: {
                    borderColorSaturation: 0.7,
                    gapWidth: 2,
                    borderWidth: 1
                  }
                },
                {
                  colorSaturation: [0.3, 0.5],
                  itemStyle: {
                    borderColorSaturation: 0.6,
                    gapWidth: 1
                  }
                },
                {
                  colorSaturation: [0.3, 0.5]
                }
              ]
            }
          ]
        })
      );
      $scope.option && $scope.myChart.setOption($scope.option);
    }

    function renderWordCloud(rawData) {
      // Configure the chart
      $scope.option = {
        title: {
          text: dataVisualization_VIZ_TYPES.SINGLE === _config.moduleType ? '' : resourceName,
          left: 'center'
        },
        tooltip: {
          show: true
        },
        series: [{
          type: 'wordCloud',
          shape: 'circle', // Shapes: 'circle', 'cardioid', 'diamond', 'triangle-forward', etc.
          sizeRange: [12, 50], // Font size range
          rotationRange: [-90, 90], // Rotation range of words
          textStyle: {
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            color: function () {
              return 'rgb(' + [
                Math.round(Math.random() * 160),
                Math.round(Math.random() * 160),
                Math.round(Math.random() * 160)
              ].join(',') + ')';
            }
          },
          data: rawData
        }]
      };

      // Render the chart
      $scope.option && $scope.myChart.setOption($scope.option);
    }

    /**
     * @description this function converts epoch time to Month Year of Month Day format as per user selection
     * 
     * @param {any} rawData this is a array of objects where every object has 1/2 keys have value epoch time
     * @param {any} heatMapConfig this parameter is used to update xAxis & yAxis data
     * @param {any} axis it could be either 'xAxis' or 'yAxis'
     */
    function _updateEpochToDate(rawData, heatMapConfig, axis) {
      rawData.forEach(data => {
        let dateToConvert, tempDate;
        // Convert date to Month Year format
        if(_config.heatMap[axis].dateFormat === '%b %y') {
          dateToConvert = new Date(data[_config.heatMap[axis].field.name] * 1000);
          tempDate = dateToConvert.toLocaleString('default', { month: 'short' }).substring(0, 3) + ' ' + dateToConvert.getFullYear();
          if (heatMapConfig[axis].indexOf(tempDate) === -1) {
            heatMapConfig[axis].push(tempDate);
          }
        } else if (_config.heatMap[axis].dateFormat === '%b %e') {
          // Convert date to Month Day Format
          dateToConvert = new Date(data[_config.heatMap[axis].field.name] * 1000);
          tempDate = dateToConvert.toLocaleString('default', { month: 'short' }).substring(0, 3) + ' ' + dateToConvert.getDate();
          if (heatMapConfig[axis].indexOf(tempDate) === -1) {
            heatMapConfig[axis].push(tempDate);
          }
        }
        data[_config.heatMap[axis].field.name] = tempDate;
      });
    }

    /**
     * @description This function calculates the cumulative total for objects with the same xAxis and yAxis values.
     * 
     * @param {any} rawData this is a array of object
     * @returns  An array of objects with cumulative totals for objects sharing the same xAxis and yAxis values.
    */
    function _constructHeatmapDatetimeData(rawData) {
      const map = new Map();
      let xAxisField = _config.heatMap.xAxis.field.name;
      let yAxisField = _config.heatMap.yAxis.field.name;

      rawData.forEach((data) => {
          const key = `${data[xAxisField]}-${data[yAxisField]}`;
          if (map.has(key)) {
              map.get(key).total += data.total;
          } else {
            let template = {};
            template[xAxisField] = data[xAxisField];
            template[yAxisField] = data[yAxisField];
            template.total = data.total;
            map.set(key, template);
          }
      });

      return Array.from(map.values());
    }

    function renderHeatmap(rawData) {
      let heatMapConfig = {
        moduleName: '',
        xAxis: [],
        yAxis: [],
        data: []
      };
      let max = 0;
      if (dataVisualization_VIZ_TYPES.ACROSS === _config.moduleType) {
        heatMapConfig.moduleName = entity.descriptions.plural ? entity.descriptions.plural : entity.descriptions.singular;
        if ($scope.fields[_config.heatMap.xAxis.field.name] && (['picklist'].indexOf(_config.heatMap.xAxis.field.type) > -1)) {
          ($scope.fields[_config.heatMap.xAxis.field.name].options).forEach(option => {
            heatMapConfig.xAxis.push(option.itemValue);
          });
        } else if ($scope.fields[_config.heatMap.xAxis.field.name] && ('datetime' === _config.heatMap.xAxis.field.type)) {
          _updateEpochToDate(rawData, heatMapConfig, 'xAxis');
        }
        if ($scope.fields[_config.heatMap.yAxis.field.name] && (['picklist'].indexOf(_config.heatMap.yAxis.field.type) > -1)) {
          ($scope.fields[_config.heatMap.yAxis.field.name].options).forEach(option => {
            heatMapConfig.yAxis.push(option.itemValue);
          });
        } else if ($scope.fields[_config.heatMap.yAxis.field.name] && ('datetime' === _config.heatMap.yAxis.field.type)) {
          _updateEpochToDate(rawData, heatMapConfig, 'yAxis');
        }
        let formedData = rawData;
        if ([_config.heatMap.xAxis.field.type, _config.heatMap.yAxis.field.type].indexOf('picklist') > -1) {
          formedData = _constructHeatmapDatetimeData(rawData);
        }
        heatMapConfig.data = formedData.map(function(data) {
          max = data['total'] > max ? data['total'] : max;
          return [heatMapConfig.xAxis.indexOf(data[_config.heatMap.xAxis.field.name]), heatMapConfig.yAxis.indexOf(data[_config.heatMap.yAxis.field.name]), data['total'] || '-'];
        });
      } else {
        heatMapConfig = rawData;
        heatMapConfig.data.forEach(function(data) {
          max = data[2] > max ? data[2] : max;
        });
      }

      $scope.option = {
        tooltip: {
          position: 'top'
        },
        grid: {
          height: '50%',
          top: '10%',
          left: '15%'
        },
        xAxis: {
          type: 'category',
          data: heatMapConfig.xAxis,
          splitArea: {
            show: true
          },
          axisLabel: {
            rotate: '45',
            width: '50',
            overflow: 'truncate',
            ellipsis: '..'
          },
          tooltip: {
            show: true
          }
        },
        yAxis: {
          type: 'category',
          data: heatMapConfig.yAxis,
          splitArea: {
            show: true
          },
          axisLabel: {
            rotate: '45',
            width: '50',
            overflow: 'truncate',
            ellipsis: '..'
          },
          tooltip: {
            show: true
          }
        },
        visualMap: {
          min: 0,
          max: max,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '15%',
          inRange: {
            color: [
              _config.heatMap.minColor, 
              _config.heatMap.maxColor
            ]
          }
        },
        series: [
          {
            name: heatMapConfig.moduleName,
            type: 'heatmap',
            data: heatMapConfig.data,
            label: {
              show: true
            },
            labelLayout: {
              hideOverlap: true
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      };

      $scope.option && $scope.myChart.setOption($scope.option);
    }

    function renderSelectedChart(formedData) {
      switch ($scope.config.vizType) {
        case dataVisualization_VIZ_MAP_TYPES.TREE_MAP:
          renderTreemapData(formedData);
          break;
        case dataVisualization_VIZ_MAP_TYPES.SUNBURST:
          renderSunburst(formedData);
          break;
        case dataVisualization_VIZ_MAP_TYPES.WORD_CLOUD:
          renderWordCloud(formedData);
          break;
        case dataVisualization_VIZ_MAP_TYPES.HEAT_MAP: 
          renderHeatmap(formedData);
          break;
      }
    }

    $scope.init = function() {
      // To handle backward compatibility for widget
      _handleTranslations();

      let loader = window.AMDLoader; // copied the amd loader properties 
      let define = window.define;
      window.AMDLoader = {};
      window.define = {};
      $scope.hideChartCanvas = false;
      dataVisualizationService.loadJs(['https://cdnjs.cloudflare.com/ajax/libs/echarts/5.6.0/echarts.min.js', 'https://cdn.jsdelivr.net/npm/echarts-wordcloud/dist/echarts-wordcloud.min.js', 'https://cdn.jsdelivr.net/npm/echarts-gl/dist/echarts-gl.min.js']).then(function () {
        $timeout(function() {
          window.AMDLoader = loader;
          window.define = define;
          entity.loadFields().then(function() {
            resourceName = entity.descriptions.plural ? entity.descriptions.plural : entity.descriptions.singular;
            $scope.fields = entity.getFormFields();
            initializeChart();
          });
        }, 1000);
      });
    }

    $scope.$on('$destroy', function() {
      $scope.myChart && echarts.dispose($scope.myChart);
    });

    $scope.init();
  }
})();
