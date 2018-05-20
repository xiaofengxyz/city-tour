"use strict";

var CityTour = CityTour || {};

CityTour.CityConfigService = function() {
  var TERRAIN_COLUMN_COUNT = 128;
  var TERRAIN_ROW_COUNT = 128;
  var NEIGHBORHOOD_MAX_COLUMNS = 20;
  var NEIGHBORHOOD_MAX_ROWS = 20;

  var heightJitter = 20;
  var heightJitterDecay = 0.65;
  var includeRiver = true;
  var hillCount = 40;
  var safeFromDecayBlocks = 6;
  var blockDistanceDecayBegins = 6;
  var maxBuildingStories = 40;
  var neighborhoodCount = 15;

  var toWorldConfig = function() {
    return {
      terrain: {
        columnCount: TERRAIN_COLUMN_COUNT,
        rowCount: TERRAIN_ROW_COUNT,
        heightJitter: heightJitter,
        heightJitterDecay: heightJitterDecay,
        hillCount: hillCount,
        probabilityOfRiver: includeRiver ? 1.0 : 0.0,
      },
      neighborhoods: {
        count: neighborhoodCount,
        columnCount: NEIGHBORHOOD_MAX_COLUMNS,
        rowCount: NEIGHBORHOOD_MAX_ROWS,
      },
      roadNetwork: {
        present: true,
        safeFromDecayBlocks: safeFromDecayBlocks,
      },
      zonedBlocks: {
        blockDistanceDecayBegins: blockDistanceDecayBegins,
        maxBuildingStories: maxBuildingStories,
      },
    };
  };


  return {
    heightJitter: function() { return heightJitter; },
    setHeightJitter: function(newHeightJitter) { heightJitter = newHeightJitter; },
    heightJitterDecay: function() { return heightJitterDecay; },
    setHeightJitterDecay: function(newHeightJitterDecay) { heightJitterDecay = newHeightJitterDecay; },
    hillCount: function() { return hillCount; },
    setHillCount: function(newHillCount) { hillCount = newHillCount; },
    includeRiver: function() { return includeRiver; },
    setIncludeRiver: function(newIncludeRiver) { includeRiver = newIncludeRiver; },
    safeFromDecayBlocks: function() { return safeFromDecayBlocks; },
    setSafeFromDecayBlocks: function(newSafeFromDecayBlocks) { safeFromDecayBlocks = newSafeFromDecayBlocks; },
    blockDistanceDecayBegins: function() { return blockDistanceDecayBegins; },
    setBlockDistanceDecayBegins: function(newBlockDistanceDecayBegins) { blockDistanceDecayBegins = newBlockDistanceDecayBegins; },
    maxBuildingStories: function() { return maxBuildingStories; },
    setMaxBuildingStories: function(newMaxBuildingStories) { maxBuildingStories = newMaxBuildingStories; },
    setNeighborhoodCount: function(newNeighborhoodCount) { neighborhoodCount = newNeighborhoodCount; },
    toWorldConfig: toWorldConfig,
  };
};
