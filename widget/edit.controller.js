/* Copyright start 
  MIT License 
  Copyright (c) 2025 Fortinet Inc 
  Copyright end */
'use strict';
(function () {
  angular
    .module('cybersponse')
    .controller('editDataVisualization100Ctrl', editDataVisualization100Ctrl);

  editDataVisualization100Ctrl.$inject = ['$scope', '$state', '$uibModalInstance', 'config', 'widgetUtilityService', '$timeout', 'appModulesService', 'Entity', 'dataVisualizationService', 'CommonUtils', 'dataVisualization_VIZ_MAP_TYPES', '_', 'dataVisualization_VIZ_TYPES'];

  function editDataVisualization100Ctrl($scope, $state, $uibModalInstance, config, widgetUtilityService, $timeout, appModulesService, Entity, dataVisualizationService, CommonUtils, dataVisualization_VIZ_MAP_TYPES, _, dataVisualization_VIZ_TYPES) {
    $scope.cancel = cancel;
    $scope.save = save;
    $scope.config = config;
    $scope.page = $state.params.page;
    $scope.dataVisualization_VIZ_MAP_TYPES = dataVisualization_VIZ_MAP_TYPES;
    $scope.dataVisualization_VIZ_TYPES = dataVisualization_VIZ_TYPES;
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
    $scope.config.moduleType = $scope.config.moduleType ? $scope.config.moduleType : $scope.dataVisualization_VIZ_TYPES.ACROSS;
    const maxLevel = 3;

    function _handleTranslations() {
      let widgetNameVersion = widgetUtilityService.getWidgetNameVersion($scope.$resolve.widget, $scope.$resolve.widgetBasePath);

      if (widgetNameVersion) {
        widgetUtilityService.checkTranslationMode(widgetNameVersion).then(function () {
          $scope.viewWidgetVars = {
            // Create your translating static string variables here
            BTN_CLOSE: widgetUtilityService.translate('dataVisualization.BTN_CLOSE'),
            BTN_SAVE: widgetUtilityService.translate('dataVisualization.BTN_SAVE'),
            HEADER_EDIT_DATA_VISUALIZATION: widgetUtilityService.translate('dataVisualization.HEADER_EDIT_DATA_VISUALIZATION'),
            LABEL_DATA_SOURCE: widgetUtilityService.translate('dataVisualization.LABEL_DATA_SOURCE'),
            LABEL_FILTER_CRITERIA: widgetUtilityService.translate('dataVisualization.LABEL_FILTER_CRITERIA'),
            LABEL_LEVEL_COUNT: widgetUtilityService.translate('dataVisualization.LABEL_LEVEL_COUNT'),
            LABEL_RESOURCE: widgetUtilityService.translate('dataVisualization.LABEL_RESOURCE'),
            LABEL_SELECT_JSON_FIELD: widgetUtilityService.translate('dataVisualization.LABEL_SELECT_JSON_FIELD'),
            LABEL_TITLE: widgetUtilityService.translate('dataVisualization.LABEL_TITLE'),
            LABEL_VIZ_TYPE: widgetUtilityService.translate('dataVisualization.LABEL_VIZ_TYPE'),
            LABEL_WORD_SOURCE: widgetUtilityService.translate('dataVisualization.LABEL_WORD_SOURCE'),
            LABEL_X_AXIS: widgetUtilityService.translate('dataVisualization.LABEL_X_AXIS'),
            LABEL_X_AXIS_DATE_FORMAT: widgetUtilityService.translate('dataVisualization.LABEL_X_AXIS_DATE_FORMAT'),
            LABEL_X_AXIS_DATE_RANGE: widgetUtilityService.translate('dataVisualization.LABEL_X_AXIS_DATE_RANGE'),
            LABEL_Y_AXIS: widgetUtilityService.translate('dataVisualization.LABEL_Y_AXIS'),
            LABEL_Y_AXIS_DATE_FORMAT: widgetUtilityService.translate('dataVisualization.LABEL_Y_AXIS_DATE_FORMAT'),
            LABEL_Y_AXIS_DATE_RANGE: widgetUtilityService.translate('dataVisualization.LABEL_Y_AXIS_DATE_RANGE'),
            OPT_SELECT_AN_OPTION: widgetUtilityService.translate('dataVisualization.OPT_SELECT_AN_OPTION'),
            RADIO_OPT_LIVE_DATA: widgetUtilityService.translate('dataVisualization.RADIO_OPT_LIVE_DATA'),
            RADIO_OPT_STATIC_DATA: widgetUtilityService.translate('dataVisualization.RADIO_OPT_STATIC_DATA'),
            TOOLTIP_DATA_SOURCE: widgetUtilityService.translate('dataVisualization.TOOLTIP_DATA_SOURCE'),
            TOOLTIP_LEVEL_COUNT: widgetUtilityService.translate('dataVisualization.TOOLTIP_LEVEL_COUNT'),
            TOOLTIP_LIVE_DATA: widgetUtilityService.translate('dataVisualization.TOOLTIP_LIVE_DATA'),
            TOOLTIP_RESOURCE: widgetUtilityService.translate('dataVisualization.TOOLTIP_RESOURCE'),
            TOOLTIP_SELECT_JSON_FIELD: widgetUtilityService.translate('dataVisualization.TOOLTIP_SELECT_JSON_FIELD'),
            TOOLTIP_STATIC_DATA: widgetUtilityService.translate('dataVisualization.TOOLTIP_STATIC_DATA'),
            TOOLTIP_WORD_SOURCE: widgetUtilityService.translate('dataVisualization.TOOLTIP_WORD_SOURCE'),
            TOOLTIP_X_AXIS: widgetUtilityService.translate('dataVisualization.TOOLTIP_X_AXIS'),
            TOOLTIP_Y_AXIS: widgetUtilityService.translate('dataVisualization.TOOLTIP_Y_AXIS'),
            TOOLTIP_X_Y_AXIS_DATE_FORMAT: widgetUtilityService.translate('dataVisualization.TOOLTIP_X_Y_AXIS_DATE_FORMAT'),
            TOOLTIP_X_Y_AXIS_DATE_RANGE: widgetUtilityService.translate('dataVisualization.TOOLTIP_X_Y_AXIS_DATE_RANGE'),
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
        if ('lookup' === field.type) {
          return 'tenants' === field.module;
        }
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
        $scope.vizList = response.data.vizTypes;
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
