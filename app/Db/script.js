window.onload = () => {
    getTables();
    setCoordinates();
    function getTables() {
      $.ajax({
        type: "GET",
        url: "http://localhost:8081/tables/",
        contentType: "application/json; charset=utf-8",
        success: function(tables, err) {
          createDiagam(tables);
        }
      });
    }
    function setCoordinates() {
      $.ajax({
        type: "GET",
        url: "http://localhost:8081/coordinates/",
        contentType: "application/json; charset=utf-8",
        success: function(coordinates, err) {
          if (coordinates) setTimeout(setLocation, 2500, coordinates);
        }
      });
    }
    function setLocation(coordinates) {
      for (let it = diagram.nodes.iterator, i = 0; it.next(); i++) {
        it.value.location = new go.Point(
          coordinates[i].x,
          coordinates[i].y
        );
      }
    }

    function createDiagam(tables) {
      myDiagramDiv = null;
      sample.innerHTML =
        "<div id = 'myDiagramDiv' style='width: 100vw; height:100vh'> </div>";
      $$ = go.GraphObject.make;
      diagram = $$(go.Diagram, "myDiagramDiv", {
        layout: $$(go.CircularLayout)
      });
      let nodes = tables.map(table => createTable(table));
      nodes.forEach(node => diagram.add(node));
      tables.forEach((table, index) => {
        table.node = nodes[index]; //додаю таблиці поле яке ссилається на його вузол
      });

      insertChildrenNodes(tables);
      createConnections(tables, diagram);
      setTimeout(() => {
        diagram.layout = $$(go.ForceDirectedLayout);
      }, 2000);
    }

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

    function highlightLinks(e, item) {
      diagram.startTransaction("changed color");
      let links = item.findLinksOutOf();
      while (links.next()) {
        links.value.isSelected = true;
      }
      diagram.commitTransaction("changed color");
    }

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

    save.addEventListener("click", savePositions);

    function savePositions() {
      let coordinates = [];
      for (var it = diagram.nodes.iterator; it.next(); ) {
        var node = it.value;
        coordinates.push({ x: node.location.x, y: node.location.y });
      }
      $.ajax({
        type: "POST",
        url: "http://localhost:8081/save/coordinates/",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: JSON.stringify({ coords: coordinates }),
      });
      alert("Saved");
    }
  };