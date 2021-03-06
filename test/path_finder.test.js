"use strict";

import { PathFinder } from "./../src/path_finder";
import { RoadNetwork } from "./../src/road_network";
import { Terrain } from "./../src/terrain";

describe("PathFinder", function() {
  var FLAT_TERRAIN_POINT = Object.freeze({landHeight: 0.0, waterHeight: 0.0});
  var terrainMesh = [
    [ FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, ],
    [ FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, ],
    [ FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, ],
    [ FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, ],
    [ FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, ],
    [ FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, ],
    [ FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, ],
    [ FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, ],
    [ FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, FLAT_TERRAIN_POINT, ],
  ];

  var terrain = Terrain(terrainMesh, 1);

  describe(".shortestPath", function() {
    var roadNetwork = RoadNetwork(terrain);
    var pathFinder = PathFinder(roadNetwork);

    roadNetwork.addEdge(0, 0, 1, 0, 0.0, 1.0, RoadNetwork.TERRAIN_SURFACE);
    roadNetwork.addEdge(1, 0, 2, 0, 0.0, 1.0, RoadNetwork.TERRAIN_SURFACE);
    roadNetwork.addEdge(2, 0, 2, 1, 0.0, 1.0, RoadNetwork.TERRAIN_SURFACE);
    roadNetwork.addEdge(2, 1, 2, 2, 0.0, 1.0, RoadNetwork.TERRAIN_SURFACE);
    roadNetwork.addEdge(2, 2, 3, 2, 0.0, 1.0, RoadNetwork.TERRAIN_SURFACE);
    roadNetwork.addEdge(2, 0, 2, -1, 0.0, 1.0, RoadNetwork.TERRAIN_SURFACE);
    roadNetwork.addEdge(2, -1, 2, -1, 0.0, 1.0, RoadNetwork.TERRAIN_SURFACE);
    roadNetwork.addEdge(2, -1, 3, -1, 0.0, 1.0, RoadNetwork.TERRAIN_SURFACE);

    it("returns undefined if either the start or end node is not an existing node", function() {
      // Start point doesn't exist
      expect(pathFinder.shortestPath(-1, 0, 1, 0)).toBe(undefined);

      // End point doesn't exist
      expect(pathFinder.shortestPath(1, 0, 3, 0)).toBe(undefined);

      // Start and end points don't exist
      expect(pathFinder.shortestPath(-1, 0, 3, 0)).toBe(undefined);

    });

    it("returns an empty array if the start and end point the same, and a valid node", function() {
      expect(pathFinder.shortestPath(1, 0, 1, 0)).toEqual([]);
    });

    it("returns a valid path if a path exists", function() {
      expect(pathFinder.shortestPath(0, 0, 1, 0)).toEqual([{x: 1, z: 0}]);
      expect(pathFinder.shortestPath(0, 0, 2, -1)).toEqual([{x: 1, z: 0}, {x: 2, z: 0}, {x: 2, z: -1}]);
    });
  });
});
