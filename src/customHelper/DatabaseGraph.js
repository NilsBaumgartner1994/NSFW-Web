import React, {Component} from 'react';
import ReactFlow from 'react-flow-renderer';

import {ReactComponentToHTMLImageRenderer} from "./ReactComponentToHTMLImageRenderer";
import {GraphHelper} from "./GraphHelper";

export class DatabaseGraph extends Component {

    static FirstTimeRendering = "firstTimeRendering"

    constructor(props) {
        super(props);
        console.log("DatabaseGraph");
        this.reactFlowInstance = null;
        this.key = DatabaseGraph.FirstTimeRendering;
        let elements = []
        if(!!props.elements && props.elements.length !== 0){
            elements = props.elements;
        }

        let elementsCopy = JSON.parse(JSON.stringify(elements));
        let layoutedElements = GraphHelper.getLayoutedElements(elementsCopy);
        let graphWidth = GraphHelper.getLayoutedWidth(elementsCopy);
        let graphHeight = GraphHelper.getLayoutedWidth(elementsCopy);

        this.state = {
            isLoading: true,
            height: graphHeight,
            width: graphWidth,
            elements: layoutedElements,
            backgroundColor: "transparent"
        };
    }

    onLoad = async (reactFlowInstance) => {
            console.log("On Load Function");
            this.reactFlowInstance = reactFlowInstance;
            this.reactFlowInstance.fitView();
            /**
             await this.setState({
                backgroundColor: "transparent"
            });
             */
            if(!!this.props.executor){
                this.props.executor(true);
            }
    };

    render() {
        let height = ReactComponentToHTMLImageRenderer.DEFAULT_HEIGHT;
        let width = ReactComponentToHTMLImageRenderer.DEFAULT_WIDTH;

        if(!!this.reactFlowInstance){
            this.reactFlowInstance.fitView();
        }

        return (
            <div style={{height: height, width: width, backgroundColor: this.state.backgroundColor}}>
                <ReactFlow key={this.key} elements={this.state.elements} onLoad={this.onLoad.bind(this)} nodeTypes={this.props.nodeTypes}>
                </ReactFlow>
            </div>
        );
    }




}
