import * as go from 'gojs';
import { ReactDiagram } from 'gojs-react';
import './App.css'
import "./Figures.js"

function init() {

  const goObject = go.GraphObject.make;

  // some constants that will be reused within templates
  var roundedRectangleParams = {
    parameter1: 2,
    spot1: go.Spot.TopLeft, spot2: go.Spot.BottomRight
  };

  //Create Diagram object
  const myDiagram =
    goObject(go.Diagram,
      {
        "animationManager.initialAnimationStyle": go.AnimationManager.None,
        "InitialAnimationStarting": e => {
          var animation = e.subject.defaultAnimation;
          animation.easing = go.Animation.EaseOutExpo;
          animation.duration = 900;
          animation.add(e.diagram, 'scale', 0.1, 1);
          animation.add(e.diagram, 'opacity', 0, 1);
        },
        // have mouse wheel events zoom in and out instead of scroll up and down
        "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
        // support double-click in background creating a new node
        "clickCreatingTool.archetypeNodeData": { text: getTime() },
        model: new go.GraphLinksModel(
          {
            linkKeyProperty: 'key',
          }),
        "undoManager.isEnabled": true,
        positionComputation: function (diagram, pt) {
          return new go.Point(Math.floor(pt.x), Math.floor(pt.y));
        }
      });



  // define the Node template
  myDiagram.nodeTemplate =
    goObject(go.Node, "Auto",
      {
        locationSpot: go.Spot.Top,
        isShadowed: true, shadowBlur: 1,
        shadowOffset: new go.Point(0, 1),
        shadowColor: "rgba(0, 0, 0, .14)"
      },
      new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
      // define the node's outer shape, which will surround the TextBlock
      goObject(go.Shape, "Hexagon", roundedRectangleParams,
        {
          name: "SHAPE", fill: getRandomColor(), strokeWidth: 0,
          stroke: null,
          width: 100,
          height: 100,
          portId: "",  // this Shape is the Node's port, not the whole Node
          fromLinkable: true, fromLinkableSelfNode: true, fromLinkableDuplicates: true,
          toLinkable: true, toLinkableSelfNode: true, toLinkableDuplicates: true,
          cursor: "pointer"
        }),
      goObject(go.TextBlock,
        {
          font: "bold small-caps 11pt helvetica, bold arial, sans-serif", margin: 7, stroke: "rgba(0, 0, 0, .87)",
          editable: true
        },
        new go.Binding("text").makeTwoWay())
    );


  // Button on Node Adornment
  myDiagram.nodeTemplate.selectionAdornmentTemplate =
    goObject(go.Adornment, "Spot",
      goObject(go.Panel, "Auto",
        goObject(go.Shape, "Hexagon", roundedRectangleParams,
          { fill: null, stroke: "red", strokeWidth: 3, width: 100, height: 100 }),
        goObject(go.Placeholder)
      ),
      // the button to create a "next" node, at the top-right corner
      goObject("Button",
        {
          alignment: go.Spot.TopCenter,
          click: addNodeAndLink
        },
        goObject(go.Shape, "PlusLine", { width: 6, height: 6 })
      )
    );


  // clicking the button inserts a new node to the right of the selected node,
  // and adds a link to that new node
  function addNodeAndLink(e, obj) {
    var adornment = obj.part;
    var diagram = e.diagram;
    diagram.startTransaction("Add State");

    // get the node data for which the user clicked the button
    var fromNode = adornment.adornedPart;
    var fromData = fromNode.data;
    // create a new "State" data object, positioned off to the right of the adorned Node
    var toData = { text: getTime() };
    var p = fromNode.location.copy();
    p.x += 200;
    toData.loc = go.Point.stringify(p);  // the "loc" property is a string, not a Point object
    // add the new node data to the model
    var model = diagram.model;
    model.addNodeData(toData);

    // create a link data from the old node data to the new node data
    var linkdata = {
      from: model.getKeyForNodeData(fromData),  // or just: fromData.id
      to: model.getKeyForNodeData(toData),
      text: ""
    };
    // and add the link data to the model
    model.addLinkData(linkdata);

    // select the new Node
    var newnode = diagram.findNodeForData(toData);
    diagram.select(newnode);

    diagram.commitTransaction("Add State");

    // if the new node is off-screen, scroll the diagram to show the new node
    diagram.scrollToRect(newnode.actualBounds);
  }

  // replace the default Link template in the linkTemplateMap
  myDiagram.linkTemplate =
    goObject(go.Link,  // the whole link panel
      {
        curve: go.Link.Bezier,
        adjusting: go.Link.Stretch,
        reshapable: true, relinkableFrom: true, relinkableTo: true,
        toShortLength: 3
      },
      new go.Binding("points").makeTwoWay(),
      new go.Binding("curviness"),
      goObject(go.Shape,  // the link shape
        { strokeWidth: 1.5 },),
      goObject(go.Shape,  // the arrowhead
        { toArrow: "standard", stroke: "white" },),
      goObject(go.TextBlock, "",
        {
          textAlign: "center",
          font: "9pt helvetica, arial, sans-serif",
          margin: 4,
          editable: true,
        },
        // editing the text automatically updates the model data

        new go.Binding("text").makeTwoWay())
    );

  // fill random color for the nodes

  function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  // fill label inside node with the current time
  function getTime() {
    return new Date().toLocaleTimeString();
  }

  return myDiagram
}


function App() {
  return (
    <div className="App">
      <ReactDiagram
        initDiagram={init}
        divClassName='diagram-component'
        // nodes that are pre rendered to Diagram
        nodeDataArray={[
          { key: 0, text: 'Alpha', loc: '0 0' },
          { key: 1, text: 'Beta', loc: '180 0' },
          { key: 2, text: 'Gamma', loc: '0 180' },
          { key: 3, text: 'Delta', loc: '180 180' },
        ]}
        // define the way how nodes are linked
        linkDataArray={[
          { key: -1, from: 0, to: 1 },
          { key: -2, from: 0, to: 2 },
          { key: -3, from: 1, to: 1 },
          { key: -4, from: 2, to: 3 },
          { key: -5, from: 3, to: 0 }
        ]}
      />
    </div>
  )
}
export default App
