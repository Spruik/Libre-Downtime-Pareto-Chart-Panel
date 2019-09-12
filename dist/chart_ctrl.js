'use strict';

System.register(['angular', 'moment', 'lodash', 'jquery', './data_processor', './pie_chart_option', './utils', './libs/echarts.min', 'app/plugins/sdk', './css/style.css!', './css/bootstrap-slider.css!'], function (_export, _context) {
	"use strict";

	var angular, moment, _, $, dp, pie, utils, echarts, MetricsPanelCtrl, _createClass, _get, panelDefaults, ChartCtrl;

	function _classCallCheck(instance, Constructor) {
		if (!(instance instanceof Constructor)) {
			throw new TypeError("Cannot call a class as a function");
		}
	}

	function _possibleConstructorReturn(self, call) {
		if (!self) {
			throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
		}

		return call && (typeof call === "object" || typeof call === "function") ? call : self;
	}

	function _inherits(subClass, superClass) {
		if (typeof superClass !== "function" && superClass !== null) {
			throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
		}

		subClass.prototype = Object.create(superClass && superClass.prototype, {
			constructor: {
				value: subClass,
				enumerable: false,
				writable: true,
				configurable: true
			}
		});
		if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
	}

	return {
		setters: [function (_angular) {
			angular = _angular.default;
		}, function (_moment) {
			moment = _moment.default;
		}, function (_lodash) {
			_ = _lodash.default;
		}, function (_jquery) {
			$ = _jquery.default;
		}, function (_data_processor) {
			dp = _data_processor;
		}, function (_pie_chart_option) {
			pie = _pie_chart_option;
		}, function (_utils) {
			utils = _utils;
		}, function (_libsEchartsMin) {
			echarts = _libsEchartsMin.default;
		}, function (_appPluginsSdk) {
			MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
		}, function (_cssStyleCss) {}, function (_cssBootstrapSliderCss) {}],
		execute: function () {
			_createClass = function () {
				function defineProperties(target, props) {
					for (var i = 0; i < props.length; i++) {
						var descriptor = props[i];
						descriptor.enumerable = descriptor.enumerable || false;
						descriptor.configurable = true;
						if ("value" in descriptor) descriptor.writable = true;
						Object.defineProperty(target, descriptor.key, descriptor);
					}
				}

				return function (Constructor, protoProps, staticProps) {
					if (protoProps) defineProperties(Constructor.prototype, protoProps);
					if (staticProps) defineProperties(Constructor, staticProps);
					return Constructor;
				};
			}();

			_get = function get(object, property, receiver) {
				if (object === null) object = Function.prototype;
				var desc = Object.getOwnPropertyDescriptor(object, property);

				if (desc === undefined) {
					var parent = Object.getPrototypeOf(object);

					if (parent === null) {
						return undefined;
					} else {
						return get(parent, property, receiver);
					}
				} else if ("value" in desc) {
					return desc.value;
				} else {
					var getter = desc.get;

					if (getter === undefined) {
						return undefined;
					}

					return getter.call(receiver);
				}
			};

			panelDefaults = {
				targets: [{}],
				pageSize: null,
				showHeader: true,
				styles: [],
				columns: [],
				fontSize: '100%'
			};

			_export('ChartCtrl', ChartCtrl = function (_MetricsPanelCtrl) {
				_inherits(ChartCtrl, _MetricsPanelCtrl);

				function ChartCtrl($scope, $injector, templateSrv, annotationsSrv, $sanitize, variableSrv) {
					_classCallCheck(this, ChartCtrl);

					var _this = _possibleConstructorReturn(this, (ChartCtrl.__proto__ || Object.getPrototypeOf(ChartCtrl)).call(this, $scope, $injector));

					_this.pageIndex = 0;

					if (_this.panel.styles === void 0) {
						_this.panel.styles = _this.panel.columns;
						_this.panel.columns = _this.panel.fields;
						delete _this.panel.columns;
						delete _this.panel.fields;
					}

					_.defaults(_this.panel, panelDefaults);

					_this.events.on('data-received', _this.onDataReceived.bind(_this));
					_this.events.on('data-error', _this.onDataError.bind(_this));
					_this.events.on('data-snapshot-load', _this.onDataReceived.bind(_this));

					_this.hasData = false;
					return _this;
				}

				_createClass(ChartCtrl, [{
					key: 'issueQueries',
					value: function issueQueries(datasource) {
						this.pageIndex = 0;

						if (this.panel.transform === 'annotations') {
							this.setTimeQueryStart();
							return this.annotationsSrv.getAnnotations({
								dashboard: this.dashboard,
								panel: this.panel,
								range: this.range
							}).then(function (annotations) {
								return { data: annotations };
							});
						}

						return _get(ChartCtrl.prototype.__proto__ || Object.getPrototypeOf(ChartCtrl.prototype), 'issueQueries', this).call(this, datasource);
					}
				}, {
					key: 'onDataError',
					value: function onDataError(err) {
						this.dataRaw = [];
						this.render();
					}
				}, {
					key: 'onDataReceived',
					value: function onDataReceived(dataList) {
						if (dataList.length === 0 || dataList === null || dataList === undefined) {
							// console.log('No data reveived')
							this.hasData = false;
							return;
						} else {
							this.hasData = true;
						}

						if (dataList[0].type !== 'table') {
							console.log('To show the pie chart, please format data as a TABLE in the Metrics Setting');
							return;
						}

						//dataList data is messy and with lots of unwanted data, so we need to filter out data that we want -
						var data = dp.restructuredData(dataList[0].columns, dataList[0].rows);

						//Calc durationint
						data = this.calcDurationInt(data);

						if (dp.getCategories(data).length === 0) {
							this.hasData = false;
							return;
						}

						this.render(data);
					}
				}, {
					key: 'calcDurationInt',
					value: function calcDurationInt(data) {
						if (!data[0].durationint) {
							var _to = this.range.to.isAfter(moment()) ? moment() : this.range.to;
							var _prevTime = null;
							for (var i = data.length - 1; i >= 0; i--) {
								var item = data[i];
								if (i === data.length - 1) {
									// first one
									var diff = _to.diff(moment(item.time));
									var duration = moment.duration(diff);
									item.durationint = duration.valueOf();
								} else {
									var _diff = _prevTime.diff(item.time);
									var _duration = moment.duration(_diff);
									item.durationint = _duration.valueOf();
								}
								_prevTime = moment(item.time);
							}
						}
						return data;
					}
				}, {
					key: 'rendering',
					value: function rendering() {
						this.render(this.globe_data);
					}
				}, {
					key: 'link',
					value: function link(scope, elem, attrs, ctrl) {
						var $panelContainer = elem.find('#reason-codes-pareto-chart')[0];
						var myChart = echarts.init($panelContainer);

						function renderPanel(data) {
							if (!myChart || !data) {
								return;
							}
							var option = pie.getOption(data, myChart);

							myChart.off('click');
							myChart.setOption(option);
							setTimeout(function () {
								$('#reason-codes-pareto-chart').height(ctrl.height - 51);
								myChart.resize();
								window.onresize = function () {
									myChart.resize();
								};
							}, 500);
							myChart.on('click', function (p) {
								if (p.seriesType === 'bar' && p.seriesName !== 'Reasons') {
									option.legend.data[0] = 'Reasons';
									option.series[0].name = 'Reasons';
									option.xAxis[0].name = 'Category: ' + p.name;
									option.toolbox.feature.myTool1.show = true;
									var reasons = dp.getReasonsData(p.name, data);

									if (!pie.checkIsDurationMode()) {
										//get reasons
										var sortedReasons = dp.sortMax(reasons, 'value');
										//get reason label
										var sortedReasonsLabel = dp.filterItems(sortedReasons, 'name');
										//get reason value
										var sortedReasonsValue = dp.filterItems(sortedReasons, 'value');
										//get reason percent
										var sortedReasonsPercent = dp.filterItems(sortedReasons, 'percent');
										sortedReasonsPercent = dp.accumulatePercentages(sortedReasonsPercent);
										//get total value
										var totalVal = sortedReasonsValue.reduce(function (total, val) {
											return total + val;
										});

										option.series[0].data = sortedReasonsValue;
										option.xAxis[0].data = sortedReasonsLabel;
										option.series[1].data = sortedReasonsPercent;
										option.yAxis[0].max = totalVal;
									} else {
										var _sortedReasons = dp.sortMax(reasons, 'duration');
										var _sortedReasonsLabel = dp.filterItems(_sortedReasons, 'name');
										var _sortedReasonsValue = dp.filterItems(_sortedReasons, 'duration');
										var _sortedReasonsPercent = dp.filterItems(_sortedReasons, 'dur-p');
										_sortedReasonsPercent = dp.accumulatePercentages(_sortedReasonsPercent);

										option.series[0].data = _sortedReasonsValue;
										option.xAxis[0].data = _sortedReasonsLabel;
										option.series[1].data = _sortedReasonsPercent;
										option.yAxis[0].max = _sortedReasons[0].durationTotal;
									}

									myChart.setOption(option);
								}
							});
						}

						ctrl.events.on('panel-size-changed', function () {
							if (myChart) {
								var height = ctrl.height - 51;
								if (height >= 280) {
									$('#reason-codes-pareto-chart').height(height);
								}
								myChart.resize();
							}
						});

						ctrl.events.on('render', function (data) {
							renderPanel(data);
							ctrl.renderingCompleted();
						});
					}
				}]);

				return ChartCtrl;
			}(MetricsPanelCtrl));

			_export('ChartCtrl', ChartCtrl);

			ChartCtrl.templateUrl = 'partials/module.html';
		}
	};
});
//# sourceMappingURL=chart_ctrl.js.map
