import React, {Component} from "react";
import mermaid from "mermaid";
import {ReactComponentToHTMLImageRenderer} from "./ReactComponentToHTMLImageRenderer";
import {DatabaseGraph} from "./DatabaseGraph";
import ReactFlow, {Handle, Position} from 'react-flow-renderer';

import initialElements from './initial-elements';
import {ReactFlowNetzplanNode} from "./ReactFlowNetzplanNode";

mermaid.initialize({startOnLoad:true, flowchart:{
        useMaxWidth:true,
        htmlLabels:true
    }});

export class NetzplanRenderer extends Component {

    static getDemoFlowElements(){
        console.log("getDemoFlowElements");
        const position = { x: 0, y: 0 };
        const elements = [];
        for(let i=0; i<10; i++){
            let label = parseInt(Math.random()*100+"");

            console.log("getNodeTypeName");
            let typename = ReactFlowNetzplanNode.getNodeTypeName();

            let element = {
                id: i+"",
                data: {
                    label: i+" X "+label,
                    buffer: i%3,
                    duration: i*10,
                    earliestStart: i,
                    earliestEnd: i+5,
                    latestStart: i+3,
                    latestEnd: i+3+5
                },
                style: ReactFlowNetzplanNode.getElementStyle(),
                type: ReactFlowNetzplanNode.getNodeTypeName(),
                sourcePosition: "bottom",
                targetPosition: "top",
                position,
            };
            elements.push(element);
            console.log(typename);

            if(i<9){
                let edge = { id: 'edge'+i+"-"+(i+1), source: i+"", target: (i+1)+"", type: 'straight' };
                elements.push(edge);
            }
        }
        return elements;
    }

    static parseNetzplanToReactFlowElements(netzplan){
        const position = { x: 0, y: 0 };

        const elements = [
        ];

        if(!netzplan){
            netzplan = {};
        }

        let labels = Object.keys(netzplan);
        for(let i=0; i<labels.length; i++){
            let label = labels[i];
            let item = netzplan[label];
            let name = label;
            let buffer = item.buffer;
            let duration = item.duration;
            let earliestStart = item.earliestStart;
            let earliestEnd = item.earliestEnd;
            let latestStart = item.latestStart;
            let latestEnd = item.latestEnd;

            let content = '"';
            content+= name+' ('+buffer+')<br>';
            content+=duration+'<br>';
            content+=earliestStart+' | '+earliestEnd+'<br>';
            content+=latestStart+' | '+latestEnd+'<br>';
            content+='"';

            let element = {
                    id: label,
                    data: {
                        label: label,
                        duration: duration,
                        buffer: buffer,
                        earliestStart: earliestStart,
                        earliestEnd: earliestEnd,
                        latestStart: latestStart,
                        latestEnd: latestEnd
                    },
                    style: ReactFlowNetzplanNode.getElementStyle(),
                    targetPosition: Position.Top,
                    sourcePosition: Position.Bottom,
                    type: ReactFlowNetzplanNode.getNodeTypeName(),
                    position,
                };
            elements.push(element);

            let children = item.children;
            for(let j=0; j<children.length; j++){
                let childLabel = children[j];
                let child = netzplan[childLabel];
                let childBuffer = child.buffer;
                let edgeStrokeStyle = {"strokeWidth": 2, stroke: "black"};

                console.log("buffer: "+buffer+" childBuffer: "+childBuffer);
                let edge = { id: 'edge'+label+"-"+childLabel, source: label, target: childLabel, type: 'smoothstep' , arrowHeadType: "arrowclosed"};
                if(buffer===0 && childBuffer===0){//critical path
                    edgeStrokeStyle.stroke= '#ff2222';
                    edge.label = "";
                } else {
                    edgeStrokeStyle.stroke= '#444444';
                    edge.label = "";
                }
                edge.style = edgeStrokeStyle;


                elements.push(edge);
            }
        }
        return elements;
    }

    static renderWithReactFlow(netzplan, executor){
        const nodeTypes = {
            [ReactFlowNetzplanNode.getNodeTypeName()]: ReactFlowNetzplanNode.getMemoRenderer(),
        };

        let elements = NetzplanRenderer.parseNetzplanToReactFlowElements(netzplan);
        elements.push(ReactFlowNetzplanNode.getLegendElement());
        //elements = NetzplanRenderer.getDemoFlowElements();
        return <DatabaseGraph elements={elements} executor={executor} nodeTypes={nodeTypes}/>;
    }

    static getNetzplanLegend(label){
        if(!!label){
            label="";
        }
        let content = '"';
        content+= "Name (Puffer)<br>";
        content+='Dauer<br>';
        content+='Frühester Start | Frühestes Ende<br>';
        content+='Spätester Start | Spätestes Ende<br>';
        content+='"';
        return "    " + "label" +label+ "[" + content + "]\n";
    }

    static parseNetzplanToMermaid(netzplan){
        let graphDefinition = `
graph TD\n
`;

        let labels = Object.keys(netzplan);
        for(let i=0; i<labels.length; i++){
            let label = labels[i];
            let item = netzplan[label];
            let name = label;
            let buffer = item.buffer;
            let duration = item.duration;
            let earliestStart = item.earliestStart;
            let earliestEnd = item.earliestEnd;
            let latestStart = item.latestStart;
            let latestEnd = item.latestEnd;

            let content = '"';
            content+= name+' ('+buffer+')<br>';
            content+=duration+'<br>';
            content+=earliestStart+' | '+earliestEnd+'<br>';
            content+=latestStart+' | '+latestEnd+'<br>';
            content+='"';

            graphDefinition+="    "+label+"["+content+"]\n";
        }
        for(let i=0; i<labels.length; i++){
            let label = labels[i];
            let item = netzplan[label];
            let buffer = item.buffer;
            let children = item.children;
            for(let j=0; j<children.length; j++){
                let childLabel = children[j];
                let child = netzplan[childLabel];
                let childBuffer = child.buffer;
                if(buffer===0 && childBuffer===0){//critical path
                    graphDefinition+="    "+label+" == crit ==> "+childLabel+"\n";
                } else {
                    graphDefinition+="    "+label+" --> "+childLabel+"\n";
                }

            }
        }
        graphDefinition+=NetzplanRenderer.getNetzplanLegend();
        return graphDefinition;
    }

    static formatSVGStringToAutoSize(svgString, id){
        let match = svgString.match("viewBox=");
        let index = match.index;
        let importantPart = svgString.slice(index);
        let correctBegin = '<svg id="graphDiv" width="'+ReactComponentToHTMLImageRenderer.DEFAULT_WIDTH+'px" height="'+ReactComponentToHTMLImageRenderer.DEFAULT_HEIGHT+'px" ';
        return correctBegin+importantPart;
    }

    static renderMermaidFlowchartGraph(graphDefinition){
        let emptyCallback = () => {}; //needed
        let graph = mermaid.mermaidAPI.render('graphDiv', graphDefinition, emptyCallback);
        graph = NetzplanRenderer.formatSVGStringToAutoSize(graph);

        let element = <div
            dangerouslySetInnerHTML={{__html: graph}}>
        </div>;

        return element;
    }

    static renderWithMermaid(netzplan){
        let graphDefinition = NetzplanRenderer.parseNetzplanToMermaid(netzplan);
        return NetzplanRenderer.renderMermaidFlowchartGraph(graphDefinition);
    }

    static async renderNetzplan(netzplan){
        let renderWithReactFlow = true;

        let promise = null;
        let elementToRender = null;

        if(renderWithReactFlow){
            let resolver = null;
            let executor = function(resolve, reject) {
                console.log("Resolver set");
                resolver = resolve;
            }

            promise = new Promise(executor);
            elementToRender = NetzplanRenderer.renderWithReactFlow(netzplan, resolver);
        } else {
            elementToRender = NetzplanRenderer.renderWithMermaid(netzplan);
        }

        return await ReactComponentToHTMLImageRenderer.reactComponentToImgage(elementToRender, promise);

    }

}
