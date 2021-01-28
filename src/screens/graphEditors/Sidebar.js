import React, {Component} from 'react';

export class Sidebar extends Component{
    constructor(props) {
        super(props);
    }

    onDragStart = (event, nodeType, data) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/customData', JSON.stringify(data));
        event.dataTransfer.effectAllowed = 'move';
    };

    render() {
        let customNodes = [];
        if(!!this.props.nodeTypes){
            let keys = Object.keys(this.props.nodeTypes);
            for(let i=0; i<keys.length; i++){
                let key = keys[i];
                const CustomNode = this.props.nodeTypes[key];
                customNodes.push(
                    <div className="output" onDragStart={(event) => this.onDragStart(event, key, {})} draggable>
                        <CustomNode />
                    </div>);
            }
        }

        return (
            <aside>
                <div className="description">Ziehe einen neuen Knoten nach links in das Diagramm</div>
                {customNodes}
            </aside>
        );
    }
}