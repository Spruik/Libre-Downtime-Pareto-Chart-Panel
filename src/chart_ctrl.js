import angular from 'angular';
import moment from 'moment';
import _ from 'lodash';
import $ from 'jquery';
import * as dp from './data_processor';
import * as pie from './pie_chart_option';
import * as utils from './utils';
import echarts from './libs/echarts.min';
import { MetricsPanelCtrl } from 'app/plugins/sdk';
import './css/style.css!';
import './css/bootstrap-slider.css!';

const panelDefaults = {
	targets: [ {} ],
	pageSize: null,
	showHeader: true,
	styles: [],
	columns: [],
	fontSize: '100%'
};

export class ChartCtrl extends MetricsPanelCtrl {
	constructor($scope, $injector, templateSrv, annotationsSrv, $sanitize, variableSrv) {
		super($scope, $injector);

		this.pageIndex = 0;

		if (this.panel.styles === void 0) {
			this.panel.styles = this.panel.columns;
			this.panel.columns = this.panel.fields;
			delete this.panel.columns;
			delete this.panel.fields;
		}

		_.defaults(this.panel, panelDefaults);

		this.events.on('data-received', this.onDataReceived.bind(this));
		this.events.on('data-error', this.onDataError.bind(this));
		this.events.on('data-snapshot-load', this.onDataReceived.bind(this));

		this.hasData = false;
	}

	issueQueries(datasource) {
		this.pageIndex = 0;

		if (this.panel.transform === 'annotations') {
			this.setTimeQueryStart();
			return this.annotationsSrv
				.getAnnotations({
					dashboard: this.dashboard,
					panel: this.panel,
					range: this.range
				})
				.then((annotations) => {
					return { data: annotations };
				});
		}

		return super.issueQueries(datasource);
	}

	onDataError(err) {
		this.dataRaw = [];
		this.render();
	}

	onDataReceived(dataList) {
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
		let data = dp.restructuredData(dataList[0].columns, dataList[0].rows);

		//Calc durationint
		data = this.calcDurationInt(data);

		if (dp.getCategories(data).length === 0) {
			this.hasData = false;
			return;
		}

		this.render(data);
	}

	calcDurationInt(data) {
		if (!data[0].durationint) {
			const _to = this.range.to.isAfter(moment()) ? moment() : this.range.to;
			let _prevTime = null;
			for (let i = data.length - 1; i >= 0; i--) {
				const item = data[i];
				if (i === data.length - 1) {
					// first one
					const diff = _to.diff(moment(item.time));
					const duration = moment.duration(diff);
					item.durationint = duration.valueOf();
				} else {
					const diff = _prevTime.diff(item.time);
					const duration = moment.duration(diff);
					item.durationint = duration.valueOf();
				}
				_prevTime = moment(item.time);
			}
		}
		return data;
	}

	rendering() {
		this.render(this.globe_data);
	}

	link(scope, elem, attrs, ctrl) {
		const $panelContainer = elem.find('#reason-codes-pareto-chart')[0];
		const myChart = echarts.init($panelContainer);

		function renderPanel(data) {
			if (!myChart || !data) {
				return;
			}
			const option = pie.getOption(data, myChart);

			myChart.off('click');
			myChart.setOption(option);
			setTimeout(() => {
				$('#reason-codes-pareto-chart').height(ctrl.height - 51);
				myChart.resize();
				window.onresize = () => {
					myChart.resize();
				};
			}, 500);
			myChart.on('click', (p) => {
				if (p.seriesType === 'bar' && p.seriesName !== 'Reasons') {
					option.legend.data[0] = 'Reasons';
					option.series[0].name = 'Reasons';
					option.xAxis[0].name = 'Category: ' + p.name;
					option.toolbox.feature.myTool1.show = true;
					let reasons = dp.getReasonsData(p.name, data);

					if (!pie.checkIsDurationMode()) {
						//get reasons
						let sortedReasons = dp.sortMax(reasons, 'value');
						//get reason label
						let sortedReasonsLabel = dp.filterItems(sortedReasons, 'name');
						//get reason value
						let sortedReasonsValue = dp.filterItems(sortedReasons, 'value');
						//get reason percent
						let sortedReasonsPercent = dp.filterItems(sortedReasons, 'percent');
						sortedReasonsPercent = dp.accumulatePercentages(sortedReasonsPercent);
						//get total value
						let totalVal = sortedReasonsValue.reduce((total, val) => total + val);

						option.series[0].data = sortedReasonsValue;
						option.xAxis[0].data = sortedReasonsLabel;
						option.series[1].data = sortedReasonsPercent;
						option.yAxis[0].max = totalVal;
					} else {
						let sortedReasons = dp.sortMax(reasons, 'duration');
						let sortedReasonsLabel = dp.filterItems(sortedReasons, 'name');
						let sortedReasonsValue = dp.filterItems(sortedReasons, 'duration');
						let sortedReasonsPercent = dp.filterItems(sortedReasons, 'dur-p');
						sortedReasonsPercent = dp.accumulatePercentages(sortedReasonsPercent);

						option.series[0].data = sortedReasonsValue;
						option.xAxis[0].data = sortedReasonsLabel;
						option.series[1].data = sortedReasonsPercent;
						option.yAxis[0].max = sortedReasons[0].durationTotal;
					}

					myChart.setOption(option);
				}
			});
		}

		ctrl.events.on('panel-size-changed', () => {
			if (myChart) {
				const height = ctrl.height - 51;
				if (height >= 280) {
					$('#reason-codes-pareto-chart').height(height);
				}
				myChart.resize();
			}
		});

		ctrl.events.on('render', (data) => {
			renderPanel(data);
			ctrl.renderingCompleted();
		});
	}
}

ChartCtrl.templateUrl = 'partials/module.html';
