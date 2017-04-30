(function(global) {
    "use strict";

    var BBox = null;
    try {
        BBox = require("b-box");
    } catch(err) {
        BBox = global.BBox;
    }

    var DOCK_DIR = [ 'top', 'left', 'right', 'bottom' ];

    function LayoutElement(element) {

        this._element = element;
        this._containerRect = null;
        this._isContent = null;
        this._isContainer = null;
        this._noArea = false;

        this.updateRect();

        this._element.style["box-sizing"] = "border-box";
        this._element.style["position"] = "absolute";
        this._element.style["top"] = "0";
        this._element.style["left"] = "0";
        this._element.style["right"] = "0";
        this._element.style["bottom"] = "0";

        DOCK_DIR.forEach(function(clsnam) {
            var f = [
                "_is", clsnam.charAt(0).toUpperCase(),
                clsnam.slice(1)
            ].join('');
            this[f] = element.classList.contains(clsnam);
        }, this);

        if(!this._isTop && !this._isLeft && !this._isRight && !this._isBottom) {
            this._isContent = true;
        }

        this.parseChildren();

        var computedStyle = this.computedStyle();
        if(computedStyle.overflowX == "visible") {
            this._element.style.overflowX = "hidden";
        }
        if(computedStyle.overflowY == "visible") {
            this._element.style.overflowY = "hidden";
        }

        this.layout();
    }
    LayoutElement.prototype.updateRect = function() {
        if(this._element === document.body) {
            var wndRect = new BBox.Rect(0, 0,
                    parseInt(window.innerWidth),
                    parseInt(window.innerHeight));
            var bboxBody = new BBox(document.body);
            wndRect.bottom -= bboxBody.marginVerticalNc();
            this._containerRect = wndRect;
        } else {
            var bbox = new BBox(this._element);
            this._containerRect = BBox.Rect.fromBBox(bbox);
            this._containerRect.bottom -=
                bbox.px("border-top-width") + bbox.px("border-bottom-width");
        }
    };

    LayoutElement.prototype.parseChildren = function() {
        this._children = LayoutElement.parseChildren(this._element);
        if(this._children.length > 0) {
            this._element.classList.add("container");
            this._element.style["overflow"] = "hidden";
            this._isContainer = true;
        } else {
            this._element.classList.add("liquid");
        }
    };

    LayoutElement.parseChildren = function(element) {
        var dock_elements = element.getElementsByClassName('dock');
        var result = [];
        if(dock_elements && dock_elements.length > 0) {
            Array.from(dock_elements).forEach(function(dock_element) {
                if(dock_element.parentNode === element) {
                    result.push(new LayoutElement(dock_element));
                }
            });
        }
        return result;
    };

    LayoutElement.prototype.layout = function() {
        this.updateRect();
        this._layout();
    };

    function elementNames(e) {
        var id = e.id;
        var c = Array.from(e.classList);
        return e.nodeName +
            (id == "" ? "" : "#" + id) +
            (c.length == 0 ? "" : "." + c.join("."))
    }
    LayoutElement.prototype.computedStyle = function() {
        return getComputedStyle(this._element);
    };
    LayoutElement.prototype._layout = function() {
        var rect = BBox.Rect.clone(this._containerRect);

        // The range is decreased down to its client width and
        // height by considering for that the scrollbar might be
        // shown.
        while(rect.right - rect.left > this._element.clientWidth) {
            rect.right--;
        }
        while(rect.bottom - rect.top > this._element.clientHeight) {
            rect.bottom--;
        }
        var zIndexBase = parseInt(this._element.style["z-index"] || "1");
        zIndexBase += this._children.length;
        this._children.forEach(function (child, i) {
            var bboxChild = new BBox(child._element);
            var childWidth = bboxChild.px("width") + bboxChild.marginHorizontalNc();
            var childHeight = bboxChild.px("height") + bboxChild.marginVerticalNc();
            child.setBound(rect);
            if(!child._noArea &&
                    (child.computedStyle().display == "none" ||
                     child.computedStyle().visibility == "hidden"))
            {
                return;
            }

            child.setNoArea(isRectAreaZero(rect));
            child._element.style["z-index"] = zIndexBase--;

            if(child._isTop) {
                child._element.style.bottom = rect.top + childHeight + "px";
                var bboxChild = new BBox(child._element);
                child._element.style.width =
                    ((rect.right - rect.left)
                     - bboxChild.marginHorizontalNc()) + "px";
                rect.top += childHeight;
            } else if(child._isLeft) {
                child._element.style.right = rect.left + childWidth + "px";
                var bboxChild = new BBox(child._element);
                child._element.style.height =
                    ((rect.bottom - rect.top)
                     - bboxChild.marginVerticalNc()) + "px";
                rect.left += childWidth;
            } else if(child._isRight) {
                child._element.style.left = rect.right - childWidth + "px";
                var bboxChild = new BBox(child._element);
                child._element.style.height =
                    ((rect.bottom - rect.top)
                     - bboxChild.marginVerticalNc()) + "px";
                rect.right -= childWidth;
            } else if(child._isBottom) {
                child._element.style.top = rect.bottom - childHeight + "px";
                var bboxChild = new BBox(child._element);
                child._element.style.width =
                    ((rect.right - rect.left)
                     - bboxChild.marginHorizontalNc()) + "px";
                rect.bottom -= childHeight;
            }
        }, this);
        this._children.forEach(function (child) {
            if(child._isContent) {
                child.setBound(rect);
                var bboxChild = new BBox(child._element);
                child._element.style.width =
                    ((rect.right - rect.left)
                     - bboxChild.marginHorizontalNc()) + "px";
                child._element.style.height =
                    ((rect.bottom - rect.top)
                     - bboxChild.marginVerticalNc()) + "px";
            }
            child.updateRect();
        });
        this._children.forEach(function (child) {
            if(child._isContainer) {
                child._layout();
            }
        });
    };

    LayoutElement.prototype.setBound = function(rect) {
        this._element.style.top = rect.top + "px";
        this._element.style.left = rect.left + "px";
        this._element.style.right = rect.right + "px";
        this._element.style.bottom = rect.bottom + "px";
    };

    /**
     * Is the rect's area zero.
     */
    function isRectAreaZero(rect) {
        return rect.top >= rect.bottom || rect.left >= rect.right;
    }

    /**
     * Set no area flag
     */
    LayoutElement.prototype.setNoArea = function(noArea) {
        if(noArea) {
            this._noArea = true;
            this._element.style.display = "none";
            this._element.style.visibility = "hidden";
        } else {
            this._noArea = false;
            this._element.style.display = "block";
            this._element.style.visibility = "visible";
        }
    };

    LayoutElement.createElement = function(whereToDock, parentElement) {

        if(whereToDock && DOCK_DIR.indexOf(whereToDock) < 0) {
            throw(whereToDock + "is not recognized. it must be one of " +
                    DOCK_DIR.join(' '));
        }

        var div = document.createElement("DIV");
        div.classList.add("dock");
        if(whereToDock) {
            div.classList.add(whereToDock);
        }
        if(parentElement) {
            parentElement.appendChild(div);
        }
        return div;
    };

    LayoutElement.select = function(element) {
        return new LayoutElement(
                LayoutElement.getElement(element));
    };

    LayoutElement.getElement = function(element) {

        if(typeof(element) === "string" &&
            element.charAt(0) === "#")
        {

            var id = element.substr(1);
            return document.getElementById(id);

        } else if(element.constructor.name === "LayoutElement") {

            return element._element;

        }

        return element;

    };

    LayoutElement.prototype.append = function(elements) {

        if(!Array.isArray(elements)) {
            return this.append([ elements ]);
        }

        elements.forEach(function(item) {
            this._element.appendChild(
                LayoutElement.getElement(item));
        }, this);

        this.parseChildren();
        this._layout();
        return this;

    };

    LayoutElement.prototype.show = function(visibilityState) {
        var docks = Array.from(this._element.getElementsByClassName("dock"));
        docks.unshift(this._element);
        docks.forEach(function(e) {
            if(visibilityState) {
                e.style.display = "block";
                e.style.visibility = "visible";
            } else {
                e.style.display = "none";
                e.style.visibility = "hidden";
            }
        });
        var layoutRoot = this.getLayoutRootElement();
        LayoutElement.select(layoutRoot).layout();
    };

    LayoutElement.prototype.getLayoutRootElement = function() {
        var e = this._element;
        while(e.parentNode && e.parentNode.classList.contains("dock")) {
            e = e.parentNode;
        }
        return e;
    };

    try {
        module.exports = LayoutElement;
    } catch (err) {
        global.LayoutElement = LayoutElement;
    }

}(Function("return this;")()));

