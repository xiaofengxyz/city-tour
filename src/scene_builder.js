"use strict";

var SceneBuilder = function() {
  var COLOR_GROUND = 0xaaaaaa;

  var buildTriangleGeometry = function(x1, y1, z1, x2, y2, z2, x3, y3, z3) {
    var triangle = new THREE.Geometry();

    triangle.vertices.push(new THREE.Vector3(x1, y1, z1));
    triangle.vertices.push(new THREE.Vector3(x2, y2, z2));
    triangle.vertices.push(new THREE.Vector3(x3, y3, z3));

    triangle.faces.push(new THREE.Face3(0, 1, 2));
    triangle.computeFaceNormals();

    return triangle;
  };

  var buildTerrainGeometry = function(terrain) {
    var mapX, mapZ;
    var sceneX_Left, sceneX_Right, sceneZ_Top, sceneZ_Bottom;

    var terrainGeometry1 = new THREE.Geometry();
    var terrainGeometry2 = new THREE.Geometry();
    var terrainMaterial1 = new THREE.MeshLambertMaterial({ color: new THREE.Color(0, 200, 0) });
    var terrainMaterial2 = new THREE.MeshLambertMaterial({ color: new THREE.Color(255, 25, 0) });

    var triangle, v1, v2, v3;

    for (mapX = 0; mapX < CityConfig.BLOCK_COLUMNS; mapX++) {
      for (mapZ = 0; mapZ < CityConfig.BLOCK_ROWS; mapZ++) {
        sceneX_Left = Coordinates.mapXToSceneX(mapX);
        sceneX_Right = sceneX_Left + CityConfig.BLOCK_WIDTH + CityConfig.STREET_WIDTH;
        sceneZ_Top = Coordinates.mapZToSceneZ(mapZ);
        sceneZ_Bottom = sceneZ_Top + CityConfig.BLOCK_DEPTH + CityConfig.STREET_DEPTH;

        triangle = buildTriangleGeometry(sceneX_Left,  terrain.heightAtCoordinates(mapX, mapZ),     sceneZ_Top,
                                         sceneX_Left,  terrain.heightAtCoordinates(mapX, mapZ + 1), sceneZ_Bottom,
                                         sceneX_Right, terrain.heightAtCoordinates(mapX + 1, mapZ), sceneZ_Top);
        terrainGeometry1.merge(triangle);

        triangle = buildTriangleGeometry(sceneX_Left,  terrain.heightAtCoordinates(mapX, mapZ + 1),     sceneZ_Bottom,
                                         sceneX_Right, terrain.heightAtCoordinates(mapX + 1, mapZ + 1), sceneZ_Bottom,
                                         sceneX_Right, terrain.heightAtCoordinates(mapX + 1, mapZ),     sceneZ_Top);
        terrainGeometry2.merge(triangle);
      }
    }

    var mesh1 = new THREE.Mesh(terrainGeometry1, terrainMaterial1);
    var mesh2 = new THREE.Mesh(terrainGeometry2, terrainMaterial2);

    return [mesh1, mesh2];
  };

  var buildRoadGeometry = function(terrain) {
    var mapX, mapZ, sceneX, sceneZ;

    var roadMaterial = new THREE.MeshBasicMaterial({ color: COLOR_GROUND, });
    var roadGeometry = new THREE.Geometry();
    var roadSegment;

    var reusableIntersectionMesh = new THREE.Mesh(new THREE.PlaneGeometry(CityConfig.STREET_WIDTH, CityConfig.STREET_DEPTH), roadMaterial);
    reusableIntersectionMesh.rotation.x = -(Math.PI / 2);

    for (mapX = 0; mapX <= CityConfig.BLOCK_COLUMNS; mapX++) {
      for (mapZ = 0; mapZ <= CityConfig.BLOCK_ROWS; mapZ++) {
        sceneX = Coordinates.mapXToSceneX(mapX);
        sceneZ = Coordinates.mapZToSceneZ(mapZ);

        // Road intersection
        roadSegment = reusableIntersectionMesh;
        roadSegment.position.x = sceneX;
        roadSegment.position.y = terrain.heightAtCoordinates(mapX, mapZ);
        roadSegment.position.z = sceneZ;
        roadSegment.updateMatrix();
        roadGeometry.merge(roadSegment.geometry, roadSegment.matrix);


        // North/South road segment
        var north = terrain.heightAtCoordinates(mapX, mapZ);
        var south = terrain.heightAtCoordinates(mapX, mapZ + 1);
        var midpoint = (north + south) / 2;
        var angle = -Math.atan2(CityConfig.BLOCK_DEPTH, (north - south));

        var segmentLength = Math.sqrt(Math.pow((south - north), 2) + Math.pow(CityConfig.BLOCK_DEPTH, 2));

        roadSegment = new THREE.Mesh(new THREE.PlaneGeometry(CityConfig.STREET_WIDTH, segmentLength), roadMaterial);
        roadSegment.position.x = sceneX;
        roadSegment.rotation.x = angle;
        roadSegment.position.y = midpoint;
        roadSegment.position.z = sceneZ + (CityConfig.STREET_DEPTH / 2) + (CityConfig.BLOCK_DEPTH / 2);
        roadSegment.updateMatrix();
        roadGeometry.merge(roadSegment.geometry, roadSegment.matrix);


        // East/West road segment
        if (mapX < CityConfig.BLOCK_COLUMNS) {
          var west = terrain.heightAtCoordinates(mapX, mapZ);
          var east = terrain.heightAtCoordinates(mapX + 1, mapZ);
          var midpoint = (west + east) / 2;
          var angle = Math.atan2((west - east), CityConfig.BLOCK_WIDTH);

          var segmentLength = Math.sqrt(Math.pow((east - west), 2) + Math.pow(CityConfig.BLOCK_WIDTH, 2));

          roadSegment = new THREE.Mesh(new THREE.PlaneGeometry(segmentLength, CityConfig.STREET_WIDTH), roadMaterial);
          roadSegment.position.x = sceneX + (CityConfig.STREET_WIDTH / 2) + (CityConfig.BLOCK_WIDTH / 2);
          roadSegment.rotation.x = -(Math.PI / 2);
          roadSegment.position.y = midpoint;
          roadSegment.rotation.y = angle;
          roadSegment.position.z = sceneZ;
          roadSegment.updateMatrix();
          roadGeometry.merge(roadSegment.geometry, roadSegment.matrix);
        }
      }
    }

    return new THREE.Mesh(roadGeometry, roadMaterial);
  };

  var buildMaterials = function() {
    var buildingMaterials = [];

    for (var i = 0; i < CityConfig.MAX_BUILDING_MATERIALS; i++) {
      var random = Math.random() * 0.6;
      var r = random;
      var g = random;
      var b = random;

      buildingMaterials.push(new THREE.MeshLambertMaterial({ color: new THREE.Color(r, g, b), }));
    }

    return buildingMaterials;
  };

  var buildEmptyGeometriesForBuildings = function() {
    var buildingGeometries = [];

    for (var i = 0; i < CityConfig.MAX_BUILDING_MATERIALS; i++) {
      buildingGeometries.push(new THREE.Geometry());
    }

    return buildingGeometries;
  };

  var generateBuildingGeometries = function(buildings, buildingGeometries) {
    var mapX, mapZ, sceneX, sceneZ;
    var block;
    var materialIndex;

    var reusableBuildingMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1));

    for (mapX = 0; mapX < CityConfig.BLOCK_COLUMNS; mapX++) {
      for (mapZ = 0; mapZ < CityConfig.BLOCK_ROWS; mapZ++) {
        sceneX = Coordinates.mapXToSceneX(mapX) + (CityConfig.STREET_WIDTH / 2);
        sceneZ = Coordinates.mapZToSceneZ(mapZ) + (CityConfig.STREET_DEPTH / 2);

        block = buildings.blockAtCoordinates(mapX, mapZ);

        block.forEach(function(lot) {
          var mapLotWidth = lot.right - lot.left;
          var mapLotDepth = lot.bottom - lot.top;
          var mapLotXMidpoint = lot.left + (mapLotWidth / 2);
          var mapLotZMidpoint = lot.top + (mapLotDepth / 2);

          reusableBuildingMesh.scale.x = mapLotWidth * CityConfig.BLOCK_WIDTH;
          reusableBuildingMesh.position.x = sceneX + (CityConfig.BLOCK_WIDTH * mapLotXMidpoint);

          reusableBuildingMesh.scale.y = Math.max(lot.yMinimumHeight, (Math.random() * lot.yTargetHeight) + CityConfig.MIN_BUILDING_HEIGHT);
          reusableBuildingMesh.position.y = (reusableBuildingMesh.scale.y / 2) + lot.yFloor;

          reusableBuildingMesh.scale.z = mapLotDepth * CityConfig.BLOCK_WIDTH;
          reusableBuildingMesh.position.z = sceneZ + (CityConfig.BLOCK_DEPTH * mapLotZMidpoint);

          reusableBuildingMesh.updateMatrix();

          materialIndex = Math.floor(Math.random() * CityConfig.MAX_BUILDING_MATERIALS);
          buildingGeometries[materialIndex].merge(reusableBuildingMesh.geometry, reusableBuildingMesh.matrix);
        });
      }
    }
  };


  var sceneBuilder = {};

  sceneBuilder.build = function(terrain, buildings) {
    var scene = new THREE.Scene();

    var terrainMeshes = buildTerrainGeometry(terrain);
    terrainMeshes.forEach(function(terrainMesh) {
      scene.add(terrainMesh);
    });

    scene.add(buildRoadGeometry(terrain));

    var buildingMaterials = buildMaterials();
    var buildingGeometries = buildEmptyGeometriesForBuildings();

    generateBuildingGeometries(buildings, buildingGeometries);

    for (var i = 0; i < CityConfig.MAX_BUILDING_MATERIALS; i++) {
      scene.add(new THREE.Mesh(buildingGeometries[i], buildingMaterials[i]));
    }

    return scene;
  };

  return sceneBuilder;
};