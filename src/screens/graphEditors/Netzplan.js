import React, {useState, useRef, Component} from 'react';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    removeElements,
    Controls, isNode,
    getOutgoers, isEdge
} from 'react-flow-renderer';
import {HeaderTemplate} from "../../templates/HeaderTemplate";
import {Button} from "primereact/button";
import {GraphHelper} from "../../customHelper/GraphHelper";
import {NetzplanNodeEditable} from "./NetzplanNodeEditable";
import {Sidebar} from "./Sidebar";
import {getCriticalPaths, init} from "netzplan";

const initNodeName = "init";

const strokeWidth = 2;
const edgeNormal = "#444444";
const edgeCritical = "#ff2222";

const initialElements = [
    {
        id: initNodeName,
        type: 'input',
        data: { label: 'Mit Startknoten verbinden' },
        position: { x: 250, y: 5 },
    },
];
let id = 1;
const getId = () => `Knoten_${id++}`;

export class Netzplan extends Component {

    static NODE_HEIGHT = 100;

    constructor(props) {
        super(props);
        this.reactFlowWrapper = React.createRef();
        this.state={
            reactFlowInstance: null,
            elements: initialElements,
            nodeIdStartNumber: 1,
            reloadNumber: 1,
        }

        const nodeTypes = {
            [NetzplanNodeEditable.getNodeTypeName()]: NetzplanNodeEditable.getMemoRenderer(),
        };
        this.nodeTypes = nodeTypes;
    }

    clearNetzplan(){
        this.updateReactFlowElements(initialElements);
    }

    autoLayoutElements(){
        let layoutedElements = GraphHelper.getLayoutedElements(this.state.elements, GraphHelper.DEFAULT_NODE_WIDTH, Netzplan.NODE_HEIGHT);
        this.updateReactFlowElements(layoutedElements);
    }

    getNetzplanJSONFromReactFlowElements(elements){
        let graphJSON = {};
        for(let i=0; i<elements.length; i++){
            let element = elements[i];
            if(isNode(element) && element.type == NetzplanNodeEditable.getNodeTypeName()){
                let reactFlowChildren = getOutgoers(element, elements);
                let children = [];
                for(let j=0; j<reactFlowChildren.length; j++){
                    let child = reactFlowChildren[j];
                    children.push(child.id+"");
                }
                let label = element.id;
                let data = element.data;
                let graphElement = {
                    children: children,
                    duration: data.duration
                }
                graphJSON[label] = graphElement;
            }
        }
        return graphJSON;
    }

    getNetzplanStartNodeFromReactFlowElements(elements){
        let startNodeLabel = undefined;
        for(let i=0; i<elements.length; i++){
            let element = elements[i];
            if(isNode(element) && element.id === initNodeName){
                let reactFlowChildren = getOutgoers(element, elements);
                if(reactFlowChildren.length===1){
                    startNodeLabel = reactFlowChildren[0].id;
                }
            }
        }
        return startNodeLabel;
    }

    calcNetzplan(){
        let startNodeLabel = this.getNetzplanStartNodeFromReactFlowElements(this.state.elements);
        if(!!startNodeLabel){
            let graphJSON = this.getNetzplanJSONFromReactFlowElements(this.state.elements);
            let calcedNetzplan = init(graphJSON, startNodeLabel);
            this.updateElementsByCalcedNetzplan(calcedNetzplan);
        }
    }

    updateReactFlowElements(elements){
        this.setState({
            elements: elements,
            reloadNumber: this.state.reloadNumber+1
        });
    }

    updateElementsByCalcedNetzplan(calcedNetzplan){
        let elements = this.state.elements;
        for(let i=0; i<elements.length; i++){
            let element = elements[i];
            if(isEdge(element)){
                console.log(element);
                let source = element.source;
                let target = element.target;
                let sourceNode = calcedNetzplan[source];
                let targetNode = calcedNetzplan[target];

                if(!!sourceNode && !!targetNode){
                    let isCritical = sourceNode.buffer === 0 && targetNode.buffer === 0;
                    element.style = {};
                    if(isCritical){
                        element.style.stroke= edgeCritical;
                    } else {
                        element.style.stroke= edgeNormal;
                    }
                    element.style.strokeWidth = strokeWidth;
                    elements[i] = element;
                }
            }
            if(isNode(element) && element.type === NetzplanNodeEditable.getNodeTypeName()){
                let id = element.id;
                let netzplanNode = calcedNetzplan[id];
                element.data.buffer = netzplanNode.buffer;
                element.data.earliestStart = netzplanNode.earliestStart;
                element.data.earliestEnd = netzplanNode.earliestEnd;
                element.data.latestStart = netzplanNode.latestStart;
                element.data.latestEnd = netzplanNode.latestEnd;
                elements[i] = element;
            }
        }
        this.updateReactFlowElements(elements);
    }

    onConnect = (params) => {
        params.arrowHeadType = "arrowclosed";
        let style = {
            strokeWidth: strokeWidth,
            stroke: edgeNormal,
        }
        params.style = style;
        this.setState({
            elements: addEdge(params, this.state.elements)
        })
    };

    onElementsRemove = (elementsToRemove) => {
        this.setState({
            elements: removeElements(elementsToRemove, this.state.elements)
        })
    }

    onLoad = (_reactFlowInstance) => {
        this.setState({
            reactFlowInstance: _reactFlowInstance
        })
    }

    onDragOver = (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    };

    onDrop = (event) => {
        event.preventDefault();
        const reactFlowBounds = this.reactFlowWrapper.current.getBoundingClientRect();
        const type = event.dataTransfer.getData('application/reactflow');
        let data = JSON.parse(event.dataTransfer.getData('application/customData'));
        const position = this.state.reactFlowInstance.project({
            x: event.clientX - reactFlowBounds.left,
            y: event.clientY - reactFlowBounds.top,
        });
        let newId = getId();

        data = Object.assign(data,{id: newId, instance: this});

        const newNode = {
            id: newId,
            type,
            position,
            data: data,
        };
        this.setState({
            elements: this.state.elements.concat(newNode)
        })
    };

    async setNodeDuration(nodeId, duration){
        this.setNodeDataProperty(nodeId, "duration", duration)
    }

    async setNodeLabel(nodeId, label){
        this.setNodeDataProperty(nodeId, "label", label)
    }

    async setNodeDataProperty(nodeId, key, value){
        let elementsCopy = this.state.elements;
        let newElements = [];
        for(let i=0; i<elementsCopy.length; i++){
            let element = elementsCopy[i];
            if(element.id === nodeId){
                let data = element.data;
                data[key] = value;
                element.data = data;
                elementsCopy[i] = element
            }
            newElements.push(element);
        }
        this.updateReactFlowElements(newElements);
    }

    renderHeader(){
        let title = "Netzplan";
        let subtitle = "Live Editor";
        return <HeaderTemplate title={title} subtitle={subtitle} />
    }

    render() {
        let height = 700;

        return (
            <div>
                {this.renderHeader()}

                <div className="content-section implementation">
                    <div className="dndflow">
                        <ReactFlowProvider key={this.state.reloadNumber+1+""}>

                    <div className="p-grid" style={{height: height}}>
                        <div className="p-col-9 p-col-nogutter" id={"graphEditorContainer"} >
                                    <div className="reactflow-wrapper" ref={this.reactFlowWrapper} style={{height: height, backgroundColor: "white"}}>
                                        <ReactFlow
                                            key={this.state.reloadNumber+""}
                                            elements={this.state.elements}
                                            onConnect={this.onConnect}
                                            onElementsRemove={this.onElementsRemove}
                                            onLoad={this.onLoad}
                                            onDrop={this.onDrop}
                                            onDragOver={this.onDragOver}
                                            nodeTypes={this.nodeTypes}
                                        >
                                            <Controls />
                                        </ReactFlow>
                                    </div>
                        </div>
                        <div className="p-col-3">
                            <div className="p-grid p-dir-col" style={{height: "100%", backgroundColor: "gray"}}>
                                <div className="p-col-3">
                                    <Button onClick={() => {this.state.reactFlowInstance.fitView()}} className="p-button-success" label={"Fit View"} ></Button>
                                    <br></br><br></br>
                                    <Button onClick={() => {this.autoLayoutElements()}} className="p-button-success" label={"Auto Layout"} ></Button>
                                    <br></br><br></br>
                                    <Button onClick={() => {this.calcNetzplan()}} className="p-button-success" label={"Netzplan berechnen"} ></Button>
                                    <br></br><br></br>
                                    <Button onClick={() => {this.clearNetzplan()}} className="p-button-danger" label={"Clear"} ></Button>
                                </div>
                                <div className="p-col-9">
                                    <Sidebar nodeTypes={this.nodeTypes} />
                                </div>
                            </div>
                        </div>
                    </div>

                        </ReactFlowProvider>
                    </div>


                </div>



            </div>
        );
    }
}