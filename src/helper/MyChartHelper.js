import React, {Component} from "react";
import {Button} from "../components/button/Button";
import {Chart} from "../components/chart/Chart";
import {Card} from "../components/card/Card";
import {ColorHelper} from "./ColorHelper";

export default class MyChartHelper extends Component {
  static renderInteractiveDateChart(
    instance,
    dataName,
    selectedKeysName,
    title,
    yAxisLabel,
    xAxisLavel,
    keyLabelFunction,
    coloringMode
  ) {
    let shownData = MyChartHelper.defaultForwardToShownData(
      instance,
      dataName,
      selectedKeysName
    );

    let filteredData = MyChartHelper.functionFilterHelperVariables(shownData);
    let counted = MyChartHelper.getCountedJSONObject(
      filteredData,
      MyChartHelper.functionCountAmount.bind(instance)
    );
    let chartData = MyChartHelper.getDatasetForCountedData(
      counted,
      null,
      keyLabelFunction,
      false,
        coloringMode
    );

    let clickOnDataFunction = MyChartHelper.defaultClickOnDataOverallDatesChartItem.bind(
      instance,
      instance,
      dataName,
      selectedKeysName
    );
    let clickOnDataBackFunction = MyChartHelper.defaultClickOnDataBack.bind(
      instance,
      instance,
      selectedKeysName
    );
    return MyChartHelper.renderChartDataCard(
      this,
      chartData,
      "bar",
      yAxisLabel,
      xAxisLavel,
      null,
      title,
      null,
      clickOnDataFunction,
      clickOnDataBackFunction
    );
  }

  static functionCountAmount(content) {
    return content.amount;
  }

  static functionFilterHelperVariables(dataRaw) {
    let clone = JSON.parse(JSON.stringify(dataRaw));
    delete clone["amount"];
    return clone;
  }

  static getDateTypeHelper(date, type) {
    let year = date.getFullYear();
    let month = date.getMonth();
    let dayInMonth = date.getDate();
    let day = date.getDay();
    let hour = date.getHours();
    let minute = date.getMinutes();
    let second = date.getSeconds();

    let types = {
      year: year,
      month: month,
      date: dayInMonth,
      day: day,
      hour: hour,
      minute: minute,
      second: second
    };

    return types[type];
  }

  static countUpByGivenDateTypes(data, label, date, types) {
    let typeAmounts = types.length;
    let keys = [];
    let savedData = [data];
    let lastIndex = typeAmounts - 1;

    for (let i = 0; i <= lastIndex; i++) {
      let type = types[i];
      let key = MyChartHelper.getDateTypeHelper(date, type);

      let lastData = savedData[savedData.length - 1];
      let newData = lastData[key];
      if (!newData) {
        if (i < lastIndex) {
          newData = {};
        } else {
          newData = [];
        }
      }

      if (i === lastIndex) {
        newData.push(label);
      }
      newData.amount = newData.amount + 1 || 1;

      keys.push(key);
      savedData.push(newData);
    }

    let lastSavedData = savedData.pop();
    while (keys.length > 0) {
      let key = keys.pop();
      let saveInto = savedData.pop();
      saveInto[key] = lastSavedData;
      lastSavedData = saveInto;
    }

    return lastSavedData;
  }

  static sortingModeLowerFirst = "lowerFirst";
  static sortingModeHigherFirst = "higherFirst";
  static sortingModeLowerIndexFirst = "lowerIndexFirst";
  static sortingModeHigherIndexFirst = "higherIndexFirst";

  static sortCountedData(countedData, sortingMode) {
    let mostCountKey = Object.keys(countedData);
    mostCountKey.sort(function(a, b) {
      console.log("sortingMode");
      console.log(sortingMode);
      if(!!sortingMode){
        if(sortingMode===MyChartHelper.sortingModeLowerIndexFirst){
          return a-b;
        }
        if(sortingMode===MyChartHelper.sortingModeHigherIndexFirst){
          return b-a;
        }
        if(sortingMode===MyChartHelper.sortingModeLowerFirst){
          return parseFloat(countedData[a]) - parseFloat(countedData[b]);
        }
        if(sortingMode===MyChartHelper.sortingModeHigherFirst){
          return parseFloat(countedData[b]) - parseFloat(countedData[a]);
        }
      }
      return parseFloat(countedData[b]) - parseFloat(countedData[a]);
    });
    return mostCountKey;
  }

  static getCountedJSONObject(jsonData, functionCount) {
    let clone = JSON.parse(JSON.stringify(jsonData));
    let keys = Object.keys(clone);
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      let content = clone[key];
      clone[key] = functionCount(content);
    }
    return clone;
  }

  static coloringModeHigherIsBetter = "higherIsBetter";
  static coloringModeLowerIsBetter = "lowerIsBetter";
  static coloringModeFirstIsBetter = "firstIsBetter";
  static coloringModeLastIsBetter = "lastIsBetter";
  static coloringModeRandom = "random";

  static colorLightGreen = "#33F802";
  static colorGreen = "#027D02";
  static colorOrange = "#F86402";
  static colorRed = "#cb3837";

  static getColorByColoringMode(coloringMode,min,max,value,index,amount){
    if(coloringMode===MyChartHelper.coloringModeRandom){
      return ColorHelper.getRandomColor();
    }

    if(coloringMode===MyChartHelper.coloringModeHigherIsBetter){
        return ColorHelper.interpolateMinMaxValue(MyChartHelper.colorLightGreen,MyChartHelper.colorRed,min,max,value);
    }
    if(coloringMode===MyChartHelper.coloringModeLowerIsBetter){
      return ColorHelper.interpolateMinMaxValue(MyChartHelper.colorRed,MyChartHelper.colorLightGreen,min,max,value);
    }
    if(coloringMode===MyChartHelper.coloringModeFirstIsBetter){
      return ColorHelper.interpolateMinMaxValue(MyChartHelper.colorRed,MyChartHelper.colorLightGreen,0,amount-1,index);
    }
    if(coloringMode===MyChartHelper.coloringModeLastIsBetter){
      return ColorHelper.interpolateMinMaxValue(MyChartHelper.colorLightGreen,MyChartHelper.colorRed,0,amount-1,index);
    }

    return ColorHelper.interpolateMinMaxValue(MyChartHelper.colorRed,MyChartHelper.colorLightGreen,min,max,value);
  }

  static getDatasetForCountedData(
    countedData,
    limit = null,
    functionParseKey = null,
    sorting = true,
    coloringMode = MyChartHelper.coloringModeHigherIsBetter,
    customSortedKeyList = null,
    sortingMode= null,
    coloringFunction = null,
  ) {
    //as thought it starts in a object
    let chartLabels = [];
    let chartData = [];
    let chartColor = [];

    let sortedMostCountKey = Object.keys(countedData);

    if (!limit) {
      limit = sortedMostCountKey.length;
    }
    let maxLimit = Math.min(limit, sortedMostCountKey.length);

    if (sorting) {
      sortedMostCountKey = MyChartHelper.sortCountedData(countedData, sortingMode);
    }
    if(!!customSortedKeyList){
      sortedMostCountKey = customSortedKeyList;
    }

    let highestValue = countedData[sortedMostCountKey[0]];
    let lowestValue = countedData[sortedMostCountKey[maxLimit-1]];
    for(let i=0;i<maxLimit;i++){
      let value = countedData[sortedMostCountKey[i]];
      highestValue = value > highestValue ? value : highestValue;
      lowestValue = value < lowestValue ? value : lowestValue;
    }

    for (let i = 0; i < maxLimit; i++) {
      let key = sortedMostCountKey[i];
      let value = countedData[key];

      let label = key;
      if (functionParseKey) {
        label = functionParseKey(key);
      }
      chartLabels.push(label);
      chartData.push(countedData[key]);

      let color = MyChartHelper.getColorByColoringMode(coloringMode,lowestValue,highestValue,value,i,maxLimit);
      if(!!coloringFunction){
        color = coloringFunction(lowestValue,highestValue,value,i,maxLimit);
      }
      chartColor.push(color);
    }

    let data = {
      labels: chartLabels,
      datasets: [
        {
          data: chartData,
          backgroundColor: chartColor,
          hoverBackgroundColor: chartColor
        }
      ]
    };
    return data;
  }

  static downloadChartAsPNG(ref, fileName) {
    let domNode = ref.current;
    let chart = domNode.chart;
    let canvas = chart.canvas;
    let image = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");

    let link = document.createElement("a");
    link.setAttribute("download", fileName + ".png");
    link.setAttribute("href", image);
    link.click();
  }

  static renderChartDownloadButton(ref, fileName) {
    return (
      <Button
        className="p-button-raised"
        label="PNG"
        icon="pi pi-download"
        iconPos="right"
        onClick={MyChartHelper.downloadChartAsPNG.bind(this, ref, fileName)}
      />
    );
  }

  static getJSONFromData(data){
    let foundData = data.datasets[0].data;
    let labels = data.labels;

    console.log(data);
    console.log(labels);
    console.log(foundData);

    let parsedJSON = {};
    for(let i=0; i<labels.length;i++){
        let label = labels[i];
        let value = foundData[i];
        parsedJSON[label] = value;
    }
    return parsedJSON;
  }

  static downloadChartAsJSON(data,fileName){
    let parsedJSON = MyChartHelper.getJSONFromData(data);
    let encodedData = encodeURIComponent(JSON.stringify(parsedJSON));

    let dataStr = "data:text/json;charset=utf-8," + encodedData;
    let link = document.createElement("a");
    link.setAttribute("download", fileName + ".json");
    link.setAttribute("href", dataStr);
    link.click();
  }

  static renderChartDownloadJSONButton(data,fileName){
     return (
      <Button
        className="p-button-raised"
        label="JSON"
        icon="pi pi-download"
        iconPos="right"
        onClick={MyChartHelper.downloadChartAsJSON.bind(this, data, fileName)}
      />
    );
  }

  static downloadChartAsCSV(data,fileName){
	let parsedJSON = MyChartHelper.getJSONFromData(data);

	let items = [parsedJSON]
const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
const header = Object.keys(items[0])
let csv = items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
csv.unshift(header.join(','))
csv = csv.join('\r\n')

console.log(csv)

let encodedData = encodeURIComponent(csv);
 let dataStr = "data:text/json;charset=utf-8," + encodedData;
    let link = document.createElement("a");
    link.setAttribute("download", fileName + ".csv");
    link.setAttribute("href", dataStr);
    link.click();
  }

  static renderChartDownloadCSVButton(data,fileName){
return (
      <Button
        className="p-button-raised"
        label="CSV"
        icon="pi pi-download"
        iconPos="right"
        onClick={MyChartHelper.downloadChartAsCSV.bind(this, data, fileName)}
      />
    );
  }

  static getDefaultChartOptions(
    yAxisLabel = "",
    xAxisLabel = "",
    functionClickOnData = null,
    yType = "linear",
  ) {
    let options = {
      legend: {
        display: false
      },
      scales: {
        xAxes: [
          {
            scaleLabel: {
              display: true,
              labelString: xAxisLabel
            },
            ticks: {
              autoSkip: false
            }
          }
        ],
        yAxes: [
          {
            scaleLabel: {
              display: true,
              labelString: yAxisLabel
            },
	    type: yType,
            ticks: {
              min: 0
            }
          }
        ]
      }
    };

    if (functionClickOnData) {
      options.onClick = functionClickOnData;
    }

    return options;
  }

  static defaultClickOnDataBack(instance, selectedKeysName) {
    let selectedKeysData = instance.state[selectedKeysName];
    selectedKeysData.pop();
    instance.setState({
      [selectedKeysName]: selectedKeysData
    });
  }

  static defaultForwardToShownData(instance, dataName, selectedKeysName) {
    let data = instance.state[dataName];
    let level = instance.state[selectedKeysName].length;
    for (let i = 0; i < level; i++) {
      let key = instance.state[selectedKeysName][i];
      data = data[key];
    }
    return data;
  }

  static defaultClickOnDataOverallDatesChartItem(
    instance,
    dataName,
    selectedKeysName,
    evt,
    item
  ) {
    try {
      let selectedKeys = instance.state[selectedKeysName];

      let shownData = MyChartHelper.defaultForwardToShownData(
        instance,
        dataName,
        selectedKeysName
      );
      let keys = Object.keys(shownData);

      let labelIndex = item[0]._index;
      let label = keys[labelIndex];

      selectedKeys.push(label);
      instance.setState({
        [selectedKeysName]: selectedKeys
      });
    } catch (e) {
      console.log(e);
    }
  }

  static renderClickBack(functionClickBack) {
    if (!functionClickBack) {
      return null;
    } else {
      return (
        <Button
          className="p-button-raised"
          label="Zurück"
          icon="pi pi-arrow-left"
          iconPos="right"
          onClick={functionClickBack}
        />
      );
    }
  }

  static renderChartDataCard(
    instance,
    data,
    type,
    yAxisLabel = null,
    xAxisLabel = null,
    options = null,
    name,
    fileName = null,
    functionClickOnData = null,
    functionClickBack = null,
    yType = "linear",
  ) {
    if (!options) {
      options = MyChartHelper.getDefaultChartOptions(
        yAxisLabel,
        xAxisLabel,
        functionClickOnData,
	yType
      );
    }
    if (!name) {
      name = "Unbennantes Chart";
    }
    if (!fileName) {
      fileName = name;
    }

    if (!type) {
      type = "bar";
    }

    instance[name + "Ref"] = React.createRef();
    let ref = instance[name + "Ref"];

    let chart = (
      <Chart
        ref={ref}
        type={type}
        data={data}
        width="640"
        height="384"
        options={options}
      />
    );

    let downloadButton = MyChartHelper.renderChartDownloadButton(ref, fileName);
    let downloadJSONButton = MyChartHelper.renderChartDownloadJSONButton(data,fileName);
    let downloadCSVButton = MyChartHelper.renderChartDownloadCSVButton(data,fileName);
    let clickBackButton = MyChartHelper.renderClickBack(functionClickBack);

    let toRender = (
      <div className="p-col">
        <Card title={name} style={{ width: "640px" }}>
          {chart}
          {clickBackButton} - {downloadButton} {downloadJSONButton} {downloadCSVButton}
        </Card>
      </div>
    );

    return toRender;
  }
}
