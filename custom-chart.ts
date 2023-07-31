/**
 * @file Custom Chart Implementation from chart.js library
 *
 * @fileoverview
 *
 * @author Chetan Agrawal <chetan.agrawal@thoughtspot.com>
 *
 * Copyright: ThoughtSpot Inc. 2023
 */

import {
    ChartColumn,
    ChartConfig,
    ChartModel,
    ChartToTSEvent,
    ColumnType,
    CustomChartContext,
    DataArray,
    getChartContext,
    PointVal,
    Query,
} from '@thoughtspot/ts-chart-sdk';
// import Chart from 'chart.js/auto';
import * as Highcharts from "highcharts";
import * as _ from 'lodash';

let globalChartReference: any;
// let hoveredItem: any;
let options: any = {
    tooltip: {
        enabled: true
    },
    legend: {
        enabled: true
    },
    plotOptions: {
        series: {
            dataLabels: {
                enabled: true
            }
        }
    },
};
let globalCTX: any;
export var dataArray: any;
function getDataForColumn(column: ChartColumn, dataArr: DataArray[]) {
    const colId = column.id;
    const idx = _.findIndex(
        dataArr,
        (dataObj: any) => dataObj.columnId === colId,
    );
    dataArray = dataArr;
    return dataArr[idx].dataValue;
}

function getColumnDataModel(configDimensions: any, dataArr: any, type: any) {
    // this should be handled in a better way
    const xAxisColumns = configDimensions?.[0].columns ?? [];
    const yAxisColumns = configDimensions?.[1].columns ?? [];

    return {
        getLabels: () => getDataForColumn(xAxisColumns[0], dataArr),
        getDatasets: () =>
            _.map(yAxisColumns, (col, idx) => ({
                label: col.name,
                data: getDataForColumn(col, dataArr),
                yAxisID: `${type}-y${idx.toString()}`,
                type: `${type}`,
            })),
        getScales: () =>
            _.reduce(
                yAxisColumns,
                (obj: any, _val, idx: number) => {
                    // eslint-disable-next-line no-param-reassign
                    obj[`${type}-y${idx.toString()}`] = {
                        grid: {
                            display: true,
                        },
                        position: idx === 0 ? 'left' : 'right',
                        title: {
                            display: true,
                            text: `${_val.name}`,
                        },
                    };
                    return obj;
                },
                {},
            ),
        getPointDetails: (xPos: number, yPos: number): PointVal[] => [
            {
                columnId: xAxisColumns[0].id,
                value: getDataForColumn(xAxisColumns[0], dataArr)[xPos],
            },
            {
                columnId: yAxisColumns[yPos].id,
                value: getDataForColumn(yAxisColumns[yPos], dataArr)[xPos],
            },
        ],
    };
}

function getDataModel(chartModel: any) {
    // column chart model
    const columnChartModel = getColumnDataModel(
        chartModel.config?.chartConfig?.[0].dimensions ?? [],
        chartModel.data?.[0].data ?? [],
        'bar',
    );

    return columnChartModel;
}

// function getParsedEvent(evt: any): Pick<PointerEvent, 'x' | 'y' | 'clientX' | 'clientY' | 'pageX' | 'pageY' | 'screenX' | 'screenY'> {
//     return _.pick(evt.native, ['clientX', 'clientY']) as Pick<PointerEvent, 'x' | 'y' | 'clientX' | 'clientY' | 'pageX' | 'pageY' | 'screenX' | 'screenY'>;
// }

function render(ctx: CustomChartContext) {
    const chartModel = ctx.getChartModel();
    const dataModel = getDataModel(chartModel);

    if (!dataModel) {
        return;
    }

    try {
        const canvas = document.getElementById('chart') as any;
        // clear canvas.
        // canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        debugger;
        globalChartReference = new Highcharts.Chart(canvas, {
            chart: {
                type: 'bar'
            },
            ...options,
            series: dataModel.getDatasets() as any,
            // series: [
            //     {
            //         type: 'bar',
            //         id: 'series1',
            //         name: 'series1',
            //         data: dataArray
            //     }
            // ]

        });
        // globalChartReference = new Chart(canvas as any, {
        //     type: 'bar',
        //     data: {
        //         labels: dataModel.getLabels(),
        //         datasets: dataModel.getDatasets() as any,
        //     },
        //     options: {
        //         scales: dataModel.getScales(),
        //         // responsive: true,
        //         maintainAspectRatio: false,
        //         interaction: {
        //             mode: 'point',
        //             intersect: true,
        //         },
        //         onClick: (e: any) => {
        //             console.log("onclick");
        //             debugger;
        //             // const activeElement = e.chart.getActiveElements()[0];
        //             const dataX = 1;//activeElement.index;
        //             const dataY = 1;//activeElement.datasetIndex;

        //             console.log(
        //                 'ChartPoint',
        //                 dataX,
        //                 dataY,
        //                 dataModel.getPointDetails(dataX, dataY),
        //             );
        //             ctx.emitEvent(ChartToTSEvent.OpenContextMenu, {
        //                 event: getParsedEvent(e),
        //                 clickedPoint: {
        //                     tuple: dataModel.getPointDetails(dataX, dataY),
        //                 },
        //             });
        //         },
        //         onHover: function(e: any, fields: any){
        //             const lx = e.layerX;
        //             // debugger;
        //             console.log(lx, fields);
        //             // const bars = fields.filter(({_view: {x,width}}) => (x - width/2) <= lx && lx <= (x + width/2));
        //             // const data = bars.map(({_index, _datasetIndex}) => this.data.datasets[_datasetIndex].data[_index]);
        //             // this.hoveredItem = {bars, data, fields};
        //         },
        //     },
        // });
    } catch (e) {
        console.error('renderfailed', e);
        throw e;
    }
}

const renderChart = async (ctx: CustomChartContext): Promise<void> => {
    // debugger;
    globalCTX = ctx;
    if (globalChartReference) {
        globalChartReference.destroy();
    }
    try {
        ctx.emitEvent(ChartToTSEvent.RenderStart, null);
        render(ctx);
    } catch (e) {
        ctx.emitEvent(ChartToTSEvent.RenderError, {
            hasError: true,
            error: e,
        });
    } finally {
        ctx.emitEvent(ChartToTSEvent.RenderComplete, null);
        let chart = document.getElementById('chart');
        menu.innerHTML = '';
        generateContextMenu();
        chart.addEventListener('contextmenu', handleContextMenu, false);
        chart.addEventListener('mousedown', handleMouseDown, false);
        
					// chart.canvas.addEventListener('contextmenu', handleContextMenu, false);
					// chart.canvas.addEventListener('mousedown', handleMouseDown, false);
    }
};
function generateContextMenu(){
    menu.style.display = 'none';
    menu.innerHTML = '';
    getMenuData().forEach((group: any) => {
        menu.append(generateContextMenuGroups(group));
    })
}
function generateContextMenuItems(itemData: any){ //itemData: {disabled: boolean, enabled: boolean, text: string}
    let item: HTMLDivElement = document.createElement('div');
    item.classList.add('item');
    if(itemData.disabled){
        item.classList.add('disabled');
    }
    item.addEventListener('click', itemData.handler ?? void(0));
    let icn: HTMLDivElement = document.createElement('div');
    icn.classList.add('icn');
    if(itemData.enabled){
        item.classList.add('tick');
    }
    let txt: HTMLDivElement = document.createElement('div');
    txt.classList.add('txt');
    txt.innerText = itemData.text;
    item.append(icn, txt);
    return item;
}
function generateContextMenuGroups(groupData: any){ // groupData: {id: string, items: itemData[]}
    let group: HTMLDivElement = document.createElement('div');
    group.classList.add('group');
    groupData.items.forEach((item: any) => {
        group.append(generateContextMenuItems(item));
    })
    return group;
}
var menu = document.querySelector(".context-menu-container") as HTMLDivElement;
function getMenuData(){
    return [
        {
            id: 'group1',
            items: [
                {
                    enabled: false,
                    disabled: true,
                    text: "Keep Only"
                },
                {
                    enabled: false,
                    disabled: true,
                    text: "Exclude"
                },
                {
                    enabled: false,
                    disabled: true,
                    text: "Drill"
                }
            ]
        },
        {
            id: 'group2',
            items: [
                {
                    enabled: false,
                    disabled: true,
                    text: "Group"
                },
                {
                    enabled: false,
                    disabled: true,
                    text: "Calculation"
                }
            ]
        },
        {
            id: 'group3',
            items: [
                {
                    enabled: false,
                    disabled: true,
                    text: "Show Data"
                }
            ]
        },
        {
            id: 'group4',
            items: [
                {
                    enabled: options.tooltip.enabled,
                    disabled: false,
                    text: "Tooltip",
                    handler: (e: any) => {
                        console.log(e);
                        options.tooltip.enabled = !options.tooltip.enabled;
                        renderChart(globalCTX);
                    }
                },
                {
                    enabled: options.plotOptions.series.dataLabels.enabled,
                    disabled: false,
                    text: "DataLabel",
                    handler: (e: any) => {
                        console.log(e);
                        options.plotOptions.series.dataLabels.enabled = !options.plotOptions.series.dataLabels.enabled;
                        renderChart(globalCTX);
                    }
                },
                {
                    enabled: options.legend.enabled,
                    disabled: false,
                    text: "Legend",
                    handler: (e: any) => {
                        console.log(e);
                        options.legend.enabled = !options.legend.enabled;
                        renderChart(globalCTX);
                    }
                }
            ]
        },
        {
            id: 'group5',
            items: [
                {
                    enabled: false,
                    disabled: false,
                    text: "Format"
                }
            ]
        },
        {
            id: 'group6',
            items: [
                {
                    enabled: false,
                    disabled: false,
                    text: "Color Palette"
                },
                {
                    enabled: false,
                    disabled: false,
                    text: "Value Axis"
                }
            ]
        }
    ];
}
// var menuData = 
function handleContextMenu(e: any){
    debugger;
    e.preventDefault();
    e.stopPropagation();
    menu.style.left = e.clientX + "px";
    menu.style.top = e.clientY + "px";
    menu.style.display = "block";
    // console.log(chart.hoveredItem);
    return(false);
}

function handleMouseDown(e: any){
    // debugger;
    console.log(e);
    menu.style.display = "none";
}
(async () => {
    const ctx = await getChartContext({
        getDefaultChartConfig: (chartModel: ChartModel): ChartConfig[] => {
            // debugger;
            const cols = chartModel.columns;

            const measureColumns = _.filter(
                cols,
                (col) => col.type === ColumnType.MEASURE,
            );

            const attributeColumns = _.filter(
                cols,
                (col) => col.type === ColumnType.ATTRIBUTE,
            );

            const axisConfig: ChartConfig = {
                key: 'column',
                dimensions: [
                    {
                        key: 'x',
                        columns: [attributeColumns[0]],
                    },
                    {
                        key: 'y',
                        columns: measureColumns.slice(0, 2),
                    },
                ],
            };
            return [axisConfig];
        },
        getQueriesFromChartConfig: (
            chartConfig: ChartConfig[],
        ): Array<Query> => {
            // debugger;
            const queries = chartConfig.map(
                (config: ChartConfig): Query =>
                    _.reduce(
                        config.dimensions,
                        (acc: Query, dimension) => ({
                            queryColumns: [
                                ...acc.queryColumns,
                                ...dimension.columns,
                            ],
                        }),
                        {
                            queryColumns: [],
                        } as Query,
                    ),
            );
            return queries;
        },
        renderChart: (ctx) => renderChart(ctx),
        chartConfigEditorDefinition: [
            {
                key: 'column',
                label: 'Custom Column',
                descriptionText:
                    'X Axis can only have attributes, Y Axis can only have measures, Color can only have attributes. ' +
                    'Should have just 1 column in Y axis with colors columns.',
                columnSections: [
                    {
                        key: 'x',
                        label: 'Custom X Axis',
                        allowAttributeColumns: true,
                        allowMeasureColumns: false,
                        allowTimeSeriesColumns: true,
                        maxColumnCount: 1,
                    },
                    {
                        key: 'y',
                        label: 'Custom Y Axis',
                        allowAttributeColumns: false,
                        allowMeasureColumns: true,
                        allowTimeSeriesColumns: false,
                    },
                ],
            },
        ],
    });

    renderChart(ctx);
})();