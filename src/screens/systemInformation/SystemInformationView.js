import React, {Component} from 'react';
import {Chart} from '../../components/chart/Chart';
import ChartJS from 'chart.js/dist/Chart.js';
import {Card} from '../../components/card/Card';
import {RequestHelper} from "../../sequelizeConnector/RequestHelper";
import {APIRequest} from "../../sequelizeConnector/APIRequest";


export class SystemInformationView extends Component {

    constructor(props) {
        super(props);
        this.keepUpdating = true;
        this.state = {
            allInformationsWithTime: {},
	    	listOfAllInformationsWithTime: [],
        };
        this.cpuChartLoaded = false;
        this.updateInformations();
    }

	componentWillUnmount() {
		this.keepUpdating = false;
    }

	/**
	 * Loop Method for reloading Washer states
	 */
	updateInformations() {
		this.getSystemInformationData();
		if (this.keepUpdating) {
			let instance = this;
			let timeout = 10 * 1000;
			setTimeout(function () {
				instance.updateInformations();
			}, timeout);
		}
	}

    storeSystemInformationsData(data){
		console.log("New Data received:");
        console.log(data);
		if(data){
			if(data.allInformationsLastUpdateTime){
			let listOfAllInformationsWithTime = this.state.listOfAllInformationsWithTime;
			if(listOfAllInformationsWithTime.length >= 360){
				listOfAllInformationsWithTime.shift();
			}
			listOfAllInformationsWithTime.push(data);
			this.setState({
				allInformationsWithTime: data,
				listOfAllInformationsWithTime: listOfAllInformationsWithTime,
			});
			console.log(listOfAllInformationsWithTime);
			} else {
				console.log("But its empty?");
			}
		}
    }

    async getSystemInformationData() {
        try {
			let response = await APIRequest.sendRequestWithAutoAuthorize(RequestHelper.REQUEST_TYPE_GET,'custom/systemInformation');
	    	this.storeSystemInformationsData(response);
        } catch (err) {
            return null;
        }
    }

    getLastUpdateTime(){
	if (this.state.allInformationsWithTime.hasOwnProperty("allInformationsLastUpdateTime")) {
            let allInformations = this.state.allInformationsWithTime;
	    let lastUpdateTime = allInformations.allInformationsLastUpdateTime;
	    if(lastUpdateTime){
		    lastUpdateTime = lastUpdateTime.toLocaleString();
	    }
	    return lastUpdateTime;
	}
    }

    getDataForFileSystemUsageChart() {
        if (this.state.allInformationsWithTime.hasOwnProperty("allInformations")) {
            let allInformations = this.state.allInformationsWithTime.allInformations;
	    if(allInformations.hasOwnProperty("fileSystem")){
		let fileSystem = allInformations.fileSystem;
		let first = fileSystem[0];
		console.log(first);
		let total = 0;
		let available = 0;
		let used = 0;
		if (first.hasOwnProperty("size")) {
		    total = first.size;
		}
		if (first.hasOwnProperty("used")) {
		    used = first.used;
		    available = total - used;
		}

		//Convert into GB https://en.wikipedia.org/wiki/Kilobyte
		total = total/(1000.0*1000.0*1000.0); // 1000 not 1024 !
		used = used/(1000.0*1000.0*1000.0); // 1000 not 1024 !
		available = available/(1000.0*1000.0*1000.0); // 1000 not 1024 !

		//Crop to 2 decimals
		total = parseFloat(total).toFixed(2);
		used = parseFloat(used).toFixed(2);
		available = parseFloat(available).toFixed(2);


		let data = {
                labels: ['DiskUsed: '+used+" GB", 'DiskFree: '+available+" GB"],
                datasets: [
                    {
                        data: [used, available],
                        backgroundColor: [
                            "#FF6384",
                            "#36eb57"
                        ],
                        hoverBackgroundColor: [
                            "#FF6384",
                            "#36eb57"
                        ]
                    }]
		};
		if (this.cpuChartLoaded) {
                    ChartJS.defaults.global.animation.duration = 0;
		}
		this.cpuChartLoaded = true;
		return data;
	    }
	}
	let data2 = {
	    labels: ['Loading'],
		datasets: [
            	    {
                	data: [100],
                	backgroundColor: [
                    	"grey",
                	],
	                hoverBackgroundColor: [
        	            "grey",
                	]
	            }]
	    };
        return data2;
    }

    getNetworkStatsDataParsed(allInformationsWithTime){
	let data = {
	    timestamp: null,
	    transmittedPerSecond: 0.0,
	    receivedPerSecond: 0.0,
	};
         if (allInformationsWithTime.hasOwnProperty("allInformations")) {
	    let allInformationsLastUpdateTime = allInformationsWithTime.allInformationsLastUpdateTime;
	    data.timestamp = allInformationsLastUpdateTime;

            let allInformations = allInformationsWithTime.allInformations;
            let networkStats = allInformations.networkStats;
            let firstConnection = networkStats[0];
            let connection = firstConnection;
            let bytesReceivedPerSecond = connection.rx_sec;
            let bytesTransmittedPerSecond = connection.tx_sec;
            let bytesReceivedTotal = connection.rx_bytes;
            let bytesTransmittedTotal = connection.tx_bytes;

            //Convert into MB https://en.wikipedia.org/wiki/Kilobyte
            let MbReceivedPerSecond = bytesReceivedPerSecond/(1000.0*1000.0); // 1000 not 1024 !
            let MbTransmittedPerSecond = bytesTransmittedPerSecond/(1000.0*1000.0); // 1000 not 1024 !
            MbReceivedPerSecond = parseFloat(MbReceivedPerSecond).toFixed(3);
            MbTransmittedPerSecond = parseFloat(MbTransmittedPerSecond).toFixed(3);

	    data.transmittedPerSecond = MbTransmittedPerSecond;
	    data.receivedPerSecond = MbReceivedPerSecond;
	}
	return data;
    }

    getDataForNetworkStatsOverTime(){
	let listOfAllInformationsWithTime = this.state.listOfAllInformationsWithTime;
	let chartLabels = [];
	let chartDataTransmitted = [];
	let chartDataReceived = [];


	for(let i=0; i<listOfAllInformationsWithTime.length;i++){
	    let allInformationsWithTime = listOfAllInformationsWithTime[i];
	    let networkStatsParsed = this.getNetworkStatsDataParsed(allInformationsWithTime);
	    let timestamp = networkStatsParsed.timestamp;
            let transmittedPerSecond = networkStatsParsed.transmittedPerSecond;
            let receivedPerSecond = networkStatsParsed.receivedPerSecond;

	    chartLabels.push(timestamp);
	    chartDataTransmitted.push(transmittedPerSecond);
	    chartDataReceived.push(receivedPerSecond);
	}

	let data = {
	    labels: chartLabels,
	    datasets: [
		{
                    label: 'Received MB/s',
                    data: chartDataReceived,
                    fill: false,
                    backgroundColor: '#42A5F5',
                    borderColor: '#42A5F5'
                },
                {
                    label: 'Transmitted MB/s',
                    data: chartDataTransmitted,
                    fill: false,
                    backgroundColor: '#66BB6A',
                    borderColor: '#66BB6A'
                }
	    ],
	};
	return data;
    }

    getDataForNetworkStats(){
	 if (this.state.allInformationsWithTime.hasOwnProperty("allInformations")) {
	    let networkStatsParsed = this.getNetworkStatsDataParsed(this.state.allInformationsWithTime);
	    let MbTransmittedPerSecond = networkStatsParsed.transmittedPerSecond;
	    let MbReceivedPerSecond = networkStatsParsed.receivedPerSecond;

            let data = {
                labels: ['Sending: '+MbTransmittedPerSecond+" KB/s", 'Receiving: '+MbReceivedPerSecond+" MB/s"],
                datasets: [
                    {
                        data: [MbTransmittedPerSecond,MbReceivedPerSecond],
                        backgroundColor: [
                            "#FF6384",
                            "#36eb57"
                        ],
                        hoverBackgroundColor: [
                            "#FF6384",
                            "#36eb57"
                        ]
                    }]
            };
            if (this.cpuChartLoaded) {
                ChartJS.defaults.global.animation.duration = 0;
            }
            this.cpuChartLoaded = true;
            return data;

	}
    }


    getDataForMemoryUsageChart() {
        if (this.state.allInformationsWithTime.hasOwnProperty("allInformations")) {
            let allInformations = this.state.allInformationsWithTime.allInformations;
            let total = 0;
            let available = 0;
            let used = 0;
            if (allInformations.hasOwnProperty("total")) {
                total = allInformations.total;
            }
            if (allInformations.hasOwnProperty("available")) {
                available = allInformations.available;
                used = total - available;
            }

	    //Convert into GB https://en.wikipedia.org/wiki/Kilobyte
	    total = total/(1000.0*1000.0*1000.0); // 1000 not 1024 !
	    used = used/(1000.0*1000.0*1000.0); // 1000 not 1024 !
	    available = available/(1000.0*1000.0*1000.0); // 1000 not 1024 !

	    //Crop to 2 decimals
	    total = parseFloat(total).toFixed(2);
	    used = parseFloat(used).toFixed(2);
	    available = parseFloat(available).toFixed(2);

            let data = {
                labels: ['MemoryUsed: '+used+" GB", 'MemoryFree: '+available+" GB"],
                datasets: [
                    {
                        data: [used, available],
                        backgroundColor: [
                            "#FF6384",
                            "#36eb57"
                        ],
                        hoverBackgroundColor: [
                            "#FF6384",
                            "#36eb57"
                        ]
                    }]
            };
            if (this.cpuChartLoaded) {
                ChartJS.defaults.global.animation.duration = 0;
            }
            this.cpuChartLoaded = true;
            return data;
        }
        let data2 = {
            labels: ['Loading'],
            datasets: [
                {
                    data: [100],
                    backgroundColor: [
                        "grey",
                    ],
                    hoverBackgroundColor: [
                        "grey",
                    ]
                }]
        };
        return data2;
    }

    getDataForServerUptime(){
		if (this.state.allInformationsWithTime.hasOwnProperty("allInformations")) {
			let allInformations = this.state.allInformationsWithTime.allInformations;
				if (allInformations.hasOwnProperty("uptimeServer")) {
				let uptime = allInformations.uptimeServer;
				return this.parseSeondsIntoReadableDuration(uptime);
			}
		}

		return "?";
    }

	getDataForMachineUptime(){
		if (this.state.allInformationsWithTime.hasOwnProperty("allInformations")) {
			let allInformations = this.state.allInformationsWithTime.allInformations;
			if (allInformations.hasOwnProperty("uptimeServer")) {
				let uptime = allInformations.uptimeMachine;
				return this.parseSeondsIntoReadableDuration(uptime);
			}
		}

		return "?";
	}

	parseSeondsIntoReadableDuration(uptime){
		let secondsTotal = parseInt(uptime);
		let seconds = parseInt(secondsTotal%60);
		let minutesTotal = parseInt(secondsTotal/60);
		let minutes = parseInt(minutesTotal%60);
		let hoursTotal = parseInt(minutesTotal/60);
		let hours = parseInt(hoursTotal%24);
		let daysTotal = parseInt(hoursTotal/24);
		let days = parseInt(daysTotal);

		return days+" Tage, "+hours+" Stunden, "+minutes+" Minuten, "+seconds+" Sekunden";
	}

    getDataForCPUUsageChart() {
        if (this.state.allInformationsWithTime.hasOwnProperty("allInformations")) {
            let allInformations = this.state.allInformationsWithTime.allInformations;
            let currentload = 0;
            let currentload_user = 0;
            if (allInformations.hasOwnProperty("currentload")) {
                currentload = allInformations.currentload;
            }
            if (allInformations.hasOwnProperty("currentload_user")) {
                currentload_user = allInformations.currentload;
                currentload -= currentload_user;
            }

            let free = 100 - currentload - currentload_user;

	    free = parseFloat(free).toFixed(2);
	    currentload = parseFloat(currentload).toFixed(2);
	    currentload_user = parseFloat(currentload_user).toFixed(2);


            let data = {
                labels: ['CurrentLoad: '+currentload+"%", 'CurrentLoadUser: '+currentload_user+"%", 'Free: '+free+"%"],
                datasets: [
                    {
                        data: [currentload, currentload_user, free],
                        backgroundColor: [
                            "#FF6384",
                            "#365aeb",
                            "#36eb57"
                        ],
                        hoverBackgroundColor: [
                            "#FF6384",
                            "#365aeb",
                            "#36eb57"
                        ]
                    }]
            };
            if (this.cpuChartLoaded) {
                ChartJS.defaults.global.animation.duration = 0;
            }
            this.cpuChartLoaded = true;
            return data;
        }
        var data2 = {
            labels: ['Loading'],
            datasets: [
                {
                    data: [100],
                    backgroundColor: [
                        "grey",
                    ],
                    hoverBackgroundColor: [
                        "grey",
                    ]
                }]
        };
        return data2;
    }

    render() {
        let cpuData = this.getDataForCPUUsageChart();
        let memoryData = this.getDataForMemoryUsageChart();
		let uptimeServerData = this.getDataForServerUptime();
		let uptimeMachineData = this.getDataForMachineUptime();
		let fileSystemData = this.getDataForFileSystemUsageChart();
		let lastUpdateTime = this.getLastUpdateTime();
		let networkStats = this.getDataForNetworkStats();
		let networkStatsOverTime = this.getDataForNetworkStatsOverTime();
	let noPoints = {
                elements: {
                    point:{
                        radius: 0
                    }
                }
	};

        return (
            <div>
                <div className="content-section introduction">
                    <div className="feature-intro">
                        <h1>Server Information</h1>
                        <p>Showing most important Information about the Server state.</p>
                    </div>
                </div>

                <div className="content-section implementation">

                    <div className="p-grid">

			<div className="p-col">
                            <Card title="LastUpdate" style={{width: '500px'}}>
                                <div>{lastUpdateTime}</div>
                            </Card>
                        </div>

			<div className="p-col">
                            <Card title="UptimeServer" style={{width: '500px'}}>
                                <div>{uptimeServerData}</div>
                            </Card>
                        </div>
					<div className="p-col">
						<Card title="UptimeMachine" style={{width: '500px'}}>
				<div>{uptimeMachineData}</div>
					</Card>
					</div>
                        <div className="p-col">
                            <Card title="CPU" style={{width: '500px'}}>
                                <Chart type="pie" data={cpuData}/>
                            </Card>
                        </div>
                        <div className="p-col">
                            <Card title="RAM" style={{width: '500px'}}>
                                <Chart type="pie" data={memoryData}/>
                            </Card>
                        </div>
			<div className="p-col">
                            <Card title="DISK" style={{width: '500px'}}>
                                <Chart type="pie" data={fileSystemData}/>
                            </Card>
                        </div>
			<div className="p-col">
                            <Card title="NetworkStats" style={{width: '500px'}}>
                                <Chart type="pie" data={networkStats}/>
                            </Card>
                        </div>
			<div className="p-col">
                            <Card title="NetworkStats Over Time" style={{width: '500px'}}>
                                <Chart type="line" data={networkStatsOverTime} options={noPoints}/>
                            </Card>
                        </div>
			<div className="p-col">
                            <Card title="Rohdaten" style={{width: '500px'}}>
                                <div style={{"word-break": "break-word"}}>{JSON.stringify(this.state.allInformationsWithTime)}</div>
                            </Card>
                        </div>
                    </div>


                    <br/><br/>


                </div>


            </div>
        )
    }
}
