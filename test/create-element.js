var chai = require("chai");
var assert = chai.assert;
var stub = require("./lib/pseudo-element");
var LayoutElement = require("../dock-n-liquid");
describe("createElement", function() {
    describe("The whereToDock parameter", function() {
        describe("Unrecognized value", function() {
            it("must raise exception", function() {
                try {
                    LayoutElement.createElement("leftTop");
                    assert(false);
                } catch(err) {
                    assert(true);
                }
            });
        });
        describe("creates valid element", function() {
            ["top", "left", "right", "bottom"].forEach(function(
                    whereToDock, i, dockDir)
            {
                describe("The element docking to " + whereToDock, function() {
                    var e = LayoutElement.createElement(whereToDock);
                    it("must have a class 'dock'", function() {
                        assert(e.classList._list.indexOf("dock") >= 0);
                    });
                    dockDir.forEach(function(className) {
                        if(className == whereToDock) {
                            it("must have a class '" + className + "'", function() {
                                assert(e.classList._list.indexOf(className) >= 0);
                            });
                        }
                    });
                    dockDir.forEach(function(className) {
                        if(className != whereToDock) {
                            it("must NOT have a class '" + className + "'", function() {
                                assert(e.classList._list.indexOf(className) < 0);
                            });
                        }
                    });
                });
            });
        });
    });
});

