import React, {Component} from 'react';

import {NetzplanRenderer} from "../../customHelper/NetzplanRenderer";
import {DatabaseGraph} from "../../customHelper/DatabaseGraph";
import {ReactComponentToHTMLImageRenderer} from "../../customHelper/ReactComponentToHTMLImageRenderer";
import {Handle, Position} from "react-flow-renderer";
import {ReactFlowNetzplanNode} from "../../customHelper/ReactFlowNetzplanNode";

export class Test extends Component {

    constructor(props) {
        super(props);
        this.state = {
            renderedImage: ""
        }
        this.elements = NetzplanRenderer.getDemoFlowElements()
    }

    async componentDidMount(){
        let typename = ReactFlowNetzplanNode.getNodeTypeName();
        console.log("")

        const nodeTypes = {
            [ReactFlowNetzplanNode.getNodeTypeName()]: ReactFlowNetzplanNode.getMemoRenderer(),
        };

        console.log(nodeTypes);

        let img = await ReactComponentToHTMLImageRenderer.reactComponentToImgageTag(<DatabaseGraph nodeTypes={nodeTypes} elements={this.elements} executor={null}/>, null);
        this.setState({
            renderedImage: img
        });
    }

    render() {
        let renderedGraph = null;

        const nodeTypes = {
            [ReactFlowNetzplanNode.getNodeTypeName()]: ReactFlowNetzplanNode,
        };


        if(true){
            renderedGraph = <DatabaseGraph elements={this.elements} nodeTypes={nodeTypes} executor={null}/>;
        }

        return <div>
            <div className="content-section implementation">

                <div className="p-grid">
                    <div className="p-col-6">
                        {renderedGraph}
                    </div>
                    <div className="p-col-6">
                        {/**this.state.renderedImage*/}
                    </div>
                </div>
            </div>
        </div>
    }
}
