/* Copyright start 
  MIT License 
  Copyright (c) 2025 Fortinet Inc 
  Copyright end */
'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('editDataVisualization100Ctrl', editDataVisualization100Ctrl);

  editDataVisualization100Ctrl.$inject = ['$scope', '$state', '$uibModalInstance', 'config', 'widgetUtilityService', '$timeout', 'appModulesService', 'Entity', 'dataVisualizationService', 'CommonUtils', 'dataVisualization_VIZ_MAP_TYPES', '_'];

  function editDataVisualization100Ctrl($scope, $state, $uibModalInstance, config, widgetUtilityService, $timeout, appModulesService, Entity, dataVisualizationService, CommonUtils, dataVisualization_VIZ_MAP_TYPES, _) {
    $scope.cancel = cancel;
    $scope.save = save;
    $scope.config = config;
    $scope.page = $state.params.page;
    $scope.dataVisualization_VIZ_MAP_TYPES = dataVisualization_VIZ_MAP_TYPES;
    $scope.loadAttributes = loadAttributes;
    $scope.onChangeModuleType = onChangeModuleType;
    $scope.dateRanges = [{
      title: 'Monthly',
      name: 'month'
    }, {
      title: 'Daily',
      name: 'day'
    }];
    $scope.dateFormatsC3 = [{
      title: 'Month Year',
      name: '%b %y'
    }, {
      title: 'Month Day',
      name: '%b %e'
    }];
    $scope.config.moduleType = $scope.config.moduleType ? $scope.config.moduleType : 'Across Modules';
    const maxLevel = 3;

    function _handleTranslations() {
      let widgetNameVersion = widgetUtilityService.getWidgetNameVersion($scope.$resolve.widget, $scope.$resolve.widgetBasePath);

      if (widgetNameVersion) {
        widgetUtilityService.checkTranslationMode(widgetNameVersion).then(function () {
          $scope.viewWidgetVars = {
            // Create your translating static string variables here
          };
        });
      } else {
        $timeout(function () {
          $scope.cancel();
        });
      }
    }

    /*
     * This method loads all initial attributes and lists.
     */
    function loadAttributes() {
      $scope.pickListFields = [];
      var entity = new Entity($scope.config.resource);
      entity.loadFields().then(function () {
        $scope.fieldsArray = entity.getFormFieldsArray();
        $scope.fields = entity.getFormFields();
        angular.extend($scope.fields, entity.getRelationshipFields());
      });
    }

    $scope.filterByFieldType = function(fieldTypes) {
      return function(field) {
        return fieldTypes.indexOf(field.type) > -1;
      }
    }

    function onChangeModuleType() {
      delete $scope.config.query;
    }

    function init() {
      // To handle backward compatibility for widget
      _handleTranslations();
      if(CommonUtils.isUndefined($scope.config.sunTree)) {
        $scope.config.sunTree = {
          mappingLevel: Array(maxLevel).fill(null)
        };
      }

      dataVisualizationService.loadVisualizationType().then(function (response) {
        $scope.config.vizList = response.data.vizTypes;
      });
      appModulesService.load(true).then(function (modules) {
        $scope.modules = modules;
        if ($scope.config.resource) {
          $scope.loadAttributes();
        }
      });
    }

    init();

    function cancel() {
      $uibModalInstance.dismiss('cancel');
    }

    function save() {
      if ($scope.editDataVisualizationForm.$invalid) {
        $scope.editDataVisualizationForm.$setTouched();
        $scope.editDataVisualizationForm.$focusOnFirstError();
        return;
      }
      $uibModalInstance.close($scope.config);
    }

  }
})();
