import * as dp from './data_processor'
import * as utils from './utils'

let isDurationMode = false

export function getOption (data, myChart) {

  let categories = dp.getCategories(data)
  categories = dp.getCategoriesData(categories, data)
  categories = dp.sortMax(categories, 'value')
  console.log(categories);
  

  const categoriesValue = dp.filterItems(categories, 'value')
  const xAxisCateogriesLabel = dp.filterItems(categories, 'name')
  let categoriesPercent = dp.filterItems(categories, 'percent')
  categoriesPercent = dp.accumulatePercentages(categoriesPercent)

  const leftYAxisMax = categories[0].total
  
  let isDurationDataLoaded = false

  //duration data
  let leftYAxisMaxDuration = categories[0].durationTotal
  let categoriesSortedByDur
  let categoriesValueDur
  let xAxisCateogriesLabelDur
  let categoriesPercentDur

  let option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      }
    },
    grid: {
      top: 80
    },
    toolbox: {
      feature: {
        myTool1: {
          show: false,
          title: 'back',
          icon: 'image://public/plugins/smart-factory-pareto-reason-codes-bar-chart-panel/images/back.png',
          onclick: () => {
            option.toolbox.feature.myTool1.show = false
            option.legend.data[0] = 'Categories'
            option.series[0].name = 'Categories'
            option.xAxis[0].name = ''
            if (!isDurationMode) {
              //load frequency data
              option.series[0].data = categoriesValue
              option.xAxis[0].data = xAxisCateogriesLabel
              option.series[1].data = categoriesPercent
              option.yAxis[0].max = leftYAxisMax 
            }else {
              //load duration data
              option.series[0].data = categoriesValueDur
              option.xAxis[0].data = xAxisCateogriesLabelDur
              option.series[1].data = categoriesPercentDur
              option.yAxis[0].max = leftYAxisMaxDuration
            }

            myChart.setOption(option)
          }
        },
        myTool2: {
          title: 'duration',
          icon: 'image://public/plugins/smart-factory-pareto-reason-codes-bar-chart-panel/images/switch.png',
          onclick: () => {
            option.legend.data[0] = 'Categories'
            option.series[0].name = 'Categories'
            option.xAxis[0].name = ''
            option.toolbox.feature.myTool1.show = false

            if (!isDurationMode) {
              option.toolbox.feature.myTool2.title = 'frequency of occurrence'
              option.yAxis[0].name = 'Duration (Hours)'

              if (!isDurationDataLoaded) {
                categoriesSortedByDur = dp.sortMax(categories, 'duration')
                categoriesValueDur = dp.filterItems(categoriesSortedByDur, 'duration')
                xAxisCateogriesLabelDur = dp.filterItems(categoriesSortedByDur, 'name')
                categoriesPercentDur = dp.filterItems(categoriesSortedByDur, 'dur-p')
                categoriesPercentDur = dp.accumulatePercentages(categoriesPercentDur)
                isDurationDataLoaded = true
              }

              option.series[0].data = categoriesValueDur
              option.xAxis[0].data = xAxisCateogriesLabelDur
              option.series[1].data = categoriesPercentDur
              option.yAxis[0].max = leftYAxisMaxDuration

              isDurationMode = true
            }else {
              option.toolbox.feature.myTool2.title = 'duration'
              option.yAxis[0].name = 'Frequency (Times)'

              option.series[0].data = categoriesValue
              option.xAxis[0].data = xAxisCateogriesLabel
              option.series[1].data = categoriesPercent
              option.yAxis[0].max = leftYAxisMax
  
              isDurationMode = false
            }

            myChart.setOption(option)
          }
        },
        saveAsImage: { 
          show: true,
          title: 'save as image'
        }
      },
      right: 42,
    },
    legend: {
      data: ['Categories','Accumulation Curve']
    },
    xAxis: [
      {
        type: 'category',
        data: xAxisCateogriesLabel,
        nameLocation: 'center',
        nameGap: 30,
        axisPointer: {
          type: 'shadow'
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: 'Frequency (Times)',
        min: 0,
        max: leftYAxisMax,
        minInterval: 1,
        axisLabel: {
          formatter: '{value}'
        },
        splitLine: {
          show: false
        }
      },
      {
        type: 'value',
        name: 'Percent',
        min: 0,
        max: 100,
        // interval: 10,
        axisLabel: {
          formatter: '{value} %'
        },
        // splitLine: {
        //   show: false
        // }
      }
    ],
    series: [
      {
        name: 'Categories',
        type: 'bar',
        data: categoriesValue
      },
      {
        name: 'Accumulation Curve',
        type: 'line',
        yAxisIndex: 1,
        data: categoriesPercent,
        label: {
          show: true,
          formatter: p => p.data === 100 ? '' : p.data + '%'
        }
      }
    ]
  }

  return option
}

export function checkIsDurationMode() {
  return isDurationMode
}
