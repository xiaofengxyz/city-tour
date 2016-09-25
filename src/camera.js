"use strict";

var CityTour = CityTour || {};

CityTour.AnimationManager = function(terrain, roadNetwork, cameraPole, camera) {
  var animationManager = {};
  var animators = [];

  var pathFinder = new CityTour.DijktrasPathFinder(roadNetwork);
  var horizontalAnimationController  = new CityTour.HorizontalAnimationController(cameraPole, pathFinder);

  var init = function() {
    var START_X = 0;
    var START_Y = 40;
    var SWOOP_DISTANCE_IN_BLOCKS = 20;

    var furthestOutIntersection = CityTour.Config.HALF_BLOCK_ROWS;
    while (!roadNetwork.hasIntersection(0, furthestOutIntersection)) {
      furthestOutIntersection -= 1;
    }

    var startZ = furthestOutIntersection + SWOOP_DISTANCE_IN_BLOCKS;
    var distanceToCityEdge = SWOOP_DISTANCE_IN_BLOCKS * CityTour.Config.BLOCK_AND_STREET_DEPTH;

    cameraPole.position.x = START_X;
    cameraPole.position.y = START_Y;
    cameraPole.position.z = startZ * CityTour.Config.BLOCK_AND_STREET_DEPTH;

    var framesUntilCityEdge = Math.abs(distanceToCityEdge / horizontalAnimationController.deltaZ());
    var terrainHeightAtTouchdown = terrain.heightAtCoordinates(0.0, furthestOutIntersection) + 0.5;
    var swoopDescentDelta = (START_Y - terrainHeightAtTouchdown) / framesUntilCityEdge;

    var vertical = new CityTour.VerticalAnimation(cameraPole, camera, terrainHeightAtTouchdown + 0.5, swoopDescentDelta);
    var horizontal = horizontalAnimationController;
    var debugBirdseye = new CityTour.DebugBirdsEyeAnimation(cameraPole, camera);
    animators = [vertical, horizontal];
    //animators = [debugBirdseye];
  };

  animationManager.animate = function(frameCount) {
    if (animators.length === 0) {
      init();
    }

    for (var i = 0; i < frameCount; i++) {
      animators.forEach(function (animator) {
        animator.animate();
      });
    }

    var mapX = CityTour.Coordinates.sceneXToMapX(cameraPole.position.x);
    var mapZ = CityTour.Coordinates.sceneZToMapZ(cameraPole.position.z);

    var y = terrain.heightAtCoordinates(mapX, mapZ);
    cameraPole.position.y = Math.max(cameraPole.position.y, y + 0.5);
  };

  return animationManager;
};


CityTour.HorizontalAnimationController = function(cameraPole, pathFinder) {
  var FORWARD_MOTION_DELTA = 0.2;
  var ROTATION_DELTA = 0.03;
  var HALF_PI = Math.PI / 2.0;
  var THREE_PI_OVER_TWO = (3.0 * Math.PI) / 2.0;
  var TWO_PI = Math.PI * 2.0;

  var targetMapX = 0.0;
  var targetSceneX = 0.0;
  var targetMapZ = 0.0;
  var targetSceneZ = 0.0;
  var deltaX = 0.0;
  var deltaZ = FORWARD_MOTION_DELTA;
  var targetAngle = 0.0;

  var clampedStep = function(current, target, delta) {
    if (current === target) {
      return target;
    }
    else {
      if (current > target) {
        if ((current - target) < delta) {
          return target;
        }
        else {
          return current - delta;
        }
      }
      else if (current < target) {
        if ((target - current) < delta) {
          return target;
        }
        else {
          return current + delta;
        }
      }
    }
  };

  var determineNextTargetPoint = function() {
    var oldTargetMapX = targetMapX;
    var oldTargetMapZ = targetMapZ;

    pathFinder.nextTarget();
    targetMapX = pathFinder.targetMapX();
    targetMapZ = pathFinder.targetMapZ();
    targetSceneX = CityTour.Coordinates.mapXToSceneX(targetMapX);
    targetSceneZ = CityTour.Coordinates.mapZToSceneZ(targetMapZ);

    deltaX = (oldTargetMapX === targetMapX) ? 0.0 : FORWARD_MOTION_DELTA;
    deltaZ = (oldTargetMapZ === targetMapZ) ? 0.0 : FORWARD_MOTION_DELTA;

    determineRotationAngle(oldTargetMapX, oldTargetMapZ, targetMapX, targetMapZ);
  };

  var determineRotationAngle = function(oldTargetMapX, oldTargetMapZ, targetMapX, targetMapZ) {
    var oldTargetAngle = targetAngle;

    var x = targetMapX - oldTargetMapX;
    var z = -(targetMapZ - oldTargetMapZ);
    var angle = Math.atan2(z, x);
    if (angle < HALF_PI) {
      angle += TWO_PI;
    }
    var rightHandedAngle = angle - HALF_PI;

    targetAngle = rightHandedAngle;

    // Prevent an extra long turn (i.e. 270deg instead of 90deg)
    if (oldTargetAngle === 0.0 && targetAngle === THREE_PI_OVER_TWO) {
      oldTargetAngle = TWO_PI;
      cameraPole.rotation.y = TWO_PI;
    }
    else if (oldTargetAngle === THREE_PI_OVER_TWO && targetAngle === 0.0) {
      oldTargetAngle = -HALF_PI;
      cameraPole.rotation.y = -HALF_PI;
    }
  };


  var horizontalAnimationController = {};

  horizontalAnimationController.deltaZ = function() { return deltaZ; };

  horizontalAnimationController.animate = function() {
    if (cameraPole.rotation.y === targetAngle &&
        cameraPole.position.x === targetSceneX &&
        cameraPole.position.z === targetSceneZ) {
      determineNextTargetPoint();
    }

    if (cameraPole.rotation.y != targetAngle) {
      cameraPole.rotation.y = clampedStep(cameraPole.rotation.y, targetAngle, ROTATION_DELTA);
    }
    else {
      cameraPole.position.x = clampedStep(cameraPole.position.x, targetSceneX, deltaX);
      cameraPole.position.z = clampedStep(cameraPole.position.z, targetSceneZ, deltaZ);
    }
  };

  return horizontalAnimationController;
};


CityTour.VerticalAnimation = function(cameraPole, camera, targetY, yDelta) {
  var targetAngle = 0.0;
  var angleDelta = 0.0155140377955;
  var framesInCurrentMode = 0;
  var framesUntilTarget = 1500;
  var mode = 'initial_swoop';
  var finished = false;

  var clampedStep = function(current, target, delta) {
    if (current === target) {
      return target;
    }
    else {
      if (current > target) {
        if ((current - target) < delta) {
          return target;
        }
        else {
          return current - delta;
        }
      }
      else if (current < target) {
        if ((target - current) < delta) {
          return target;
        }
        else {
          return current + delta;
        }
      }
    }
  };

  var animate = function() {
    framesInCurrentMode += 1;

    cameraPole.position.y = clampedStep(cameraPole.position.y, targetY, yDelta);
    camera.rotation.x = clampedStep(camera.rotation.x, targetAngle, angleDelta);

    if (framesInCurrentMode >= framesUntilTarget) {
      if (mode === 'driving') {
        mode = 'birdseye';
        targetY = 150;
        yDelta = 2;
        targetAngle = -(Math.PI / 3);
      }
      else if (mode === 'hovering' || mode === 'initial_swoop') {
        mode = 'driving';
        targetY = -100000;
        yDelta = 0.05;
        targetAngle = 0.0;
      }
      else if (mode === 'birdseye') {
        mode = 'hovering';
        targetY = 15;
        yDelta = 2;
        targetAngle = 0.0;
      }

      framesInCurrentMode = 0;
    }
  };

  var verticalAnimation = {};
  verticalAnimation.animate = animate;
  verticalAnimation.finished = function() { return finished; };

  return verticalAnimation;
};


CityTour.DebugBirdsEyeAnimation = function(camera) {
  var finished = false;

  var debugBirdsEyeAnimation = {};

  debugBirdsEyeAnimation.animate = function() {
    camera.position.x = 0;
    camera.position.y = 900;
    camera.position.z = 0;
    camera.rotation.x = -(Math.PI / 2);
  };
  debugBirdsEyeAnimation.finished = function() { return finished; };

  return debugBirdsEyeAnimation;
};
