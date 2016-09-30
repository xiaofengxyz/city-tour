"use strict";

var CityTour = CityTour || {};

CityTour.AerialPathFinder = function(roadNetwork, initialTargetMapX, initialTargetMapZ) {
  var targetMapX = initialTargetMapX;
  var targetMapZ = initialTargetMapZ;
  var deltaX = 0.0;
  var deltaZ = 1.0;

  var determineNextTargetPoint = function() {
    var oldTargetMapX = targetMapX;
    var oldTargetMapZ = targetMapZ;

    while ((oldTargetMapX === targetMapX && oldTargetMapZ === targetMapZ) || !roadNetwork.hasIntersection(targetMapX, targetMapZ)) {
      if (deltaX === 0.0) {
        targetMapX = Math.floor(Math.random() * CityTour.Config.BLOCK_ROWS) - CityTour.Config.HALF_BLOCK_ROWS;
      }
      else if (deltaZ === 0.0) {
        targetMapZ = Math.floor(Math.random() * CityTour.Config.BLOCK_COLUMNS) - CityTour.Config.HALF_BLOCK_COLUMNS;
      }
    }

    deltaX = (deltaX === 0.0) ? 1.0 : 0.0;
    deltaZ = (deltaZ === 0.0) ? 1.0 : 0.0;
  };

  var pathFinder = {};

  pathFinder.targetMapX = function() { return targetMapX; };
  pathFinder.targetMapZ = function() { return targetMapZ; };

  pathFinder.nextTarget = function() {
    determineNextTargetPoint();
  };

  return pathFinder;
};


CityTour.DijktrasPathFinder = function(roadNetwork, initialTargetMapX, initialTargetMapZ) {
  var Node = function(x, z) {
    return {
      isVisited: false,
      distance:  Number.POSITIVE_INFINITY,
      previous:  null,
      x:         x,
      z:         z,
    };
  };

  var chooseNewTarget = function() {
    var newTargetMapX;
    var newTargetMapZ;

    do {
      newTargetMapX = (Math.round(Math.random() * CityTour.Config.BLOCK_COLUMNS)) - CityTour.Config.HALF_BLOCK_COLUMNS;
      newTargetMapZ = (Math.round(Math.random() * CityTour.Config.BLOCK_ROWS)) - CityTour.Config.HALF_BLOCK_ROWS;
    } while (!roadNetwork.hasIntersection(newTargetMapX, newTargetMapZ));

    return [newTargetMapX, newTargetMapZ];
  };

  var extractShortestPath = function(nodes, endX, endZ) {
    var path = [];
    var currentNode = nodes[endX][endZ];
    var previous;

    while (currentNode.previous) {
      path.unshift([currentNode.x, currentNode.z]);

      previous = currentNode.previous;
      currentNode = nodes[previous[0]][previous[1]];
    }

    return path;
  };

  var evaluateNodeConnections = function(currentNode, nodes, unvisitedSet) {
    var x = currentNode.x;
    var z = currentNode.z;

    var evaluateAdjacentNode = function(adjacentX, adjacentZ) {
      var adjacentNode, candidateDistance;
    
      if (roadNetwork.hasEdgeBetween(x, z, adjacentX, adjacentZ)) {
        adjacentNode = nodes[adjacentX][adjacentZ];

        if (!adjacentNode) {
          adjacentNode = new Node(adjacentX, adjacentZ);
          nodes[adjacentX][adjacentZ] = adjacentNode;
          unvisitedSet.add(adjacentNode);
        }
        if (!adjacentNode.isVisited) {
          candidateDistance = currentNode.distance + 1;
          if (candidateDistance < adjacentNode.distance) {
            adjacentNode.distance = candidateDistance;
            adjacentNode.previous = [x, z];
          }
        }
      }
    };

    evaluateAdjacentNode(x - 1, z);
    evaluateAdjacentNode(x + 1, z);
    evaluateAdjacentNode(x, z - 1);
    evaluateAdjacentNode(x, z + 1);

    currentNode.isVisited = true;
  };

  var unvisitedNodeWithShortestLength = function(unvisitedSet) {
    var shortestLength = Number.POSITIVE_INFINITY;
    var shortestLengthNode = null;

    unvisitedSet.forEach(function(node) {
      if (node.distance < shortestLength) {
        shortestLength = node.distance;
        shortestLengthNode = node;
      }
    });

    return shortestLengthNode;
  };

  var simplifyPath = function(path) {
    var xRun = 0;
    var zRun = 0;
    var previousX = subTargetMapX;
    var previousZ = subTargetMapZ;

    var simplifiedPath = [];

    var i, x, z;
    for (i = 0; i < path.length; i++) {
      x = path[i][0];
      z = path[i][1];
      xRun = (x === previousX) ? xRun + 1 : 0;
      zRun = (z === previousZ) ? zRun + 1 : 0;

      if (((xRun === 1 && zRun === 0) || (xRun === 0 && zRun === 1)) && (i > 0)) {
        simplifiedPath.push([previousX, previousZ]);
      }

      previousX = x;
      previousZ = z;
    };

    simplifiedPath.push([x, z]);

    return simplifiedPath;
  };

  var findShortestPath = function(startX, startZ, endX, endZ) {
    var nodes = [];
    var unvisitedSet = new Set();
    var x;

    for (x = -CityTour.Config.HALF_BLOCK_COLUMNS; x <= CityTour.Config.HALF_BLOCK_COLUMNS; x++) {
      nodes[x] = [];
    }

    var currentNode;

    nodes[startX][startZ] = new Node(startX, startZ);
    currentNode = nodes[startX][startZ];
    currentNode.distance = 0;

    while(currentNode.x != endX || currentNode.z != endZ) {
      evaluateNodeConnections(currentNode, nodes, unvisitedSet); 
      unvisitedSet.delete(currentNode);

      currentNode = unvisitedNodeWithShortestLength(unvisitedSet);
    }

    var path = extractShortestPath(nodes, endX, endZ);
    path = simplifyPath(path);

    return path;
  };

  var targetMapX = initialTargetMapX;
  var targetMapZ = initialTargetMapZ;
  var subTargetMapX = initialTargetMapX;
  var subTargetMapZ = initialTargetMapZ;

  var path = [];

  var dijktrasPathFinder = {};

  dijktrasPathFinder.targetMapX = function() { return subTargetMapX; };
  dijktrasPathFinder.targetMapZ = function() { return subTargetMapZ; };

  dijktrasPathFinder.nextTarget = function() {
    if (path.length === 0) {
      var newTargetCoordinates = chooseNewTarget();
      path = findShortestPath(targetMapX, targetMapZ, newTargetCoordinates[0], newTargetCoordinates[1]);

      targetMapX = newTargetCoordinates[0];
      targetMapZ = newTargetCoordinates[1];
    }

    var nextTargetPoint = path.splice(0, 1);
    subTargetMapX = nextTargetPoint[0][0];
    subTargetMapZ = nextTargetPoint[0][1];
  };

  return dijktrasPathFinder;
};
