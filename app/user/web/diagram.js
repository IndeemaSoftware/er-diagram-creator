/**
 * set coordinates for each tables
 * @param {array} coordinates
 */
function setLocation(coordinates) {
  for (let it = diagram.nodes.iterator, i = 0; it.next(); i++) {
    it.value.location = new go.Point(coordinates[i].x, coordinates[i].y);
  }
}
/**
 * create goJs diagram, nodes with data of each table, connection between nodes
 * @param {array} tables
 */
function createDiagam(tables) {
  myDiagramDiv = null;
  sample.innerHTML =
    "<div id = 'myDiagramDiv' style='width: 100vw; height:100vh'> </div>";
  $$ = go.GraphObject.make;
  diagram = $$(go.Diagram, "myDiagramDiv", {
    layout: $$(go.ForceDirectedLayout)
  });
  let nodes = tables.map(table => createTable(table));
  nodes.forEach(node => diagram.add(node));
  tables.forEach((table, index) => {
    table.node = nodes[index];
  });

  insertChildrenNodes(tables);
  createConnections(tables, diagram);
  setTimeout(() => {
    diagram.layout = $$(go.ForceDirectedLayout);
  }, 2000);
}
/**
 * create node from table data
 * @param {object} table - table data
 * @returns {object} finished node
 */
function createTable(table) {
  let margin = 3,
    width = 150,
    color = table.isMain ? "red" : "#fcba03",
    strokeWidth = 2;
  let node = $$(
    go.Node,
    "Auto",
    { click: highlightLinks },
    {
      selectionAdorned: true,
      fromSpot: go.Spot.AllSides,
      toSpot: go.Spot.AllSides
    },
    $$(go.Shape, "RoundedRectangle", {
      parameter1: 2,
      fill: "white",
      stroke: color,
      strokeWidth: strokeWidth
    }),
    $$(
      go.Panel,
      "Table",
      $$(go.RowColumnDefinition, {
        column: 2,
        separatorStrokeWidth: strokeWidth,
        separatorStroke: color
      }),
      $$(go.RowColumnDefinition, {
        row: 1,
        separatorStrokeWidth: strokeWidth,
        separatorStroke: color
      }),
      $$(go.RowColumnDefinition, {
        row: 0,
        column: 1,
        coversSeparators: true,
        background: "white"
      }),
      $$(go.TextBlock, {
        text: table.name,
        row: 0,
        column: 1,
        margin: margin,
        alignment: go.Spot.Left
      }),
      ...R.flatten(
        table.data.map((elem, index) => {
          return [
            $$(go.TextBlock, elem.fieldName, {
              row: index + 1,
              column: 1,
              margin: margin,
              alignment: go.Spot.Left,
              width: width
            }),
            $$(go.TextBlock, elem.type, {
              row: index + 1,
              column: 2,
              margin: margin,
              alignment: go.Spot.Left,
              width: width
            })
          ];
        })
      )
    )
  );

  return node;
}
/**
 * hilight links connected to recenntly clicked node
 * @param {object} item - list of nodes
 */
function highlightLinks(e, item) {
  diagram.startTransaction("changed color");
  let links = item.findLinksOutOf();
  while (links.next()) {
    links.value.isSelected = true;
  }
  diagram.commitTransaction("changed color");
}
/**
 * add link to each child of table
 * @param {array} tables - all tables
 */
function insertChildrenNodes(tables) {
  tables.forEach(table => {
    if (table.children) {
      table.children = table.children.map(child => {
        let node = tables.find(table => table.name === child.name);
        if (node) {
          node = node.node;
        } else {
          node = null;
        }
        return { ...child, node };
      });
    }
  });
}
/**
 * create connection between tables nodes
 * @param {object} tables - all tables
 */
function createConnections(tables, diagram) {
  tables.forEach(table => {
    if (table.children.length) {
      table.children.forEach(child => {
        diagram.add(
          $$(
            go.Link,
            {
              selectionAdorned: true,
              routing: go.Link.AvoidsNodes,
              curve: go.Link.JumpOver,
              corner: 5
            },
            {
              fromNode: table.node,
              toNode: child.node
            },
            $$(go.Shape, { stroke: "black", strokeWidth: 1.5 }),
            $$(go.Shape, {
              fromArrow: child.connection[0],
              scale: 1.5
            }),
            $$(go.Shape, { toArrow: child.connection[1], scale: 1.2 })
          )
        );
      });
    }
  });
}

save.addEventListener("click", saveDiagram);
/**
 * save coordinates of each node and send them to server
 */
function saveDiagram() {
  let coordinates = [];
  for (var it = diagram.nodes.iterator; it.next(); ) {
    var node = it.value;
    coordinates.push({ x: node.location.x, y: node.location.y });
  }
  axios({
    method: "post",
    url: `../../diagram/save/${diagramName.innerHTML}`,
    data: { coords: coordinates }
  });
  alert("Saved");
}
