(function(global) {
    "use strict";

    var BBox = null;
    try {
        BBox = require("b-box");
    } catch(err) {
        BBox = global.BBox;
    }

    var DOCK_DIR = [ 'top', 'left', 'right', 'bottom' ];

    function dock_n_liquid(element) {

        this._element = element;
        this._isContent = null;
        this._isContainer = null;
        this._disappeared = false;

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
            this._element.classList.add("liquid");
        }

        parseChildPanelsOf(this);

        var computedStyle = computedStyleOf(this);
        if(computedStyle.overflowX == "visible") {
            this._element.style.overflowX = "hidden";
        }
        if(computedStyle.overflowY == "visible") {
            this._element.style.overflowY = "hidden";
        }

        this.layout();
        this.layout();
    }

    /**
     * Update the layout of panel
     */
    dock_n_liquid.prototype.layout = function() {

        var rect = getRect(this);
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

            if(!child._disappeared) {
                var childStyle = computedStyleOf(child);
                if(childStyle.display == "none" ||
                   childStyle.visibility == "hidden")
                {
                    return;
                }
            }

            var bboxChild = new BBox(child._element);
            var childWidth = bboxChild.px("width") + bboxChild.marginHorizontalNc();
            var childHeight = bboxChild.px("height") + bboxChild.marginVerticalNc();
            setRect(child, rect);

            if(isRectAreaZero(rect)) {
                disappear(child);
            } else {
                appear(child);
            }
            child._element.style["z-index"] = zIndexBase--;

            if(child._isTop) {
                child._element.style.bottom = rect.top + childHeight + "px";
                child._element.style.width =
                    ((rect.right - rect.left)
                     - bboxChild.marginHorizontalNc()) + "px";
                rect.top += childHeight;
            } else if(child._isLeft) {
                child._element.style.right = rect.left + childWidth + "px";
                child._element.style.height =
                    ((rect.bottom - rect.top)
                     - bboxChild.marginVerticalNc()) + "px";
                rect.left += childWidth;
            } else if(child._isRight) {
                child._element.style.left = rect.right - childWidth + "px";
                child._element.style.height =
                    ((rect.bottom - rect.top)
                     - bboxChild.marginVerticalNc()) + "px";
                rect.right -= childWidth;
            } else if(child._isBottom) {
                child._element.style.top = rect.bottom - childHeight + "px";
                child._element.style.width =
                    ((rect.right - rect.left)
                     - bboxChild.marginHorizontalNc()) + "px";
                rect.bottom -= childHeight;
            }

        }, this);
        this._children.forEach(function (child) {
            if(child._isContent) {
                setRect(child, rect);
                var bboxChild = new BBox(child._element);
                child._element.style.width =
                    ((rect.right - rect.left)
                     - bboxChild.marginHorizontalNc()) + "px";
                child._element.style.height =
                    ((rect.bottom - rect.top)
                     - bboxChild.marginVerticalNc()) + "px";
            }
        });
        this._children.forEach(function (child) {
            if(child._isContainer) {
                child.layout();
            }
        });
    };

    /**
     * Change panels visibility state.
     */
    dock_n_liquid.prototype.show = function(visibilityState) {
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
        var layoutRoot = rootElementOf(this);
        dock_n_liquid.select(layoutRoot).layout();
    };

    /*
     * static methods
     */

    /**
     * select and return 'Dock-n-Liquid' panel instance.
     *
     * PARAMETER
     *
     * element - reference the panel elements
     *
     * ```
     * var dock_n_liquid = require("dock-n-liquid");
     *
     * dock_n_liquid.select("#the-root-panel");
     * // or
     * dock_n_liquid.select(document.getElementById("the-root-panel"));
     * ```
     */
    dock_n_liquid.select = function(element) {
        return new dock_n_liquid(getElement(element));
    };

    /**
     * Initialize 'Dock-n-Liquid' panels.
     * The layout of those are updated when the window is resized.
     *
     * PARAMETERS
     * callback - callback function invoked after the window is resized.
     * callbackObject - a 'this' object of the callback is invoked
     */
    dock_n_liquid.init = function(callback, callbackObject) {
        var roots = (function(rootElements) {
            Array.from(document.getElementsByClassName("dock"))
            .forEach(function(dock) {
                if(dock.parentNode && dock.parentNode.nodeType == 1 &&
                    !dock.parentNode.classList.contains("dock") &&
                    !rootElements.includes(dock))
                {
                    rootElements.push(dock);
                }
            });
            return rootElements;
        }([])).map(function(rootElement) {
            return dock_n_liquid.select(rootElement);
        });

        window.addEventListener("resize", function() {
            roots.forEach(function(root) {
                root.layout();
                root.layout();
                if(callback) {
                    callback.call(callbackObject);
                }
            });
        });

    };

    /* unstable */
    dock_n_liquid.prototype.append = function(elements) {

        if(!Array.isArray(elements)) {
            return this.append([ elements ]);
        }

        elements.forEach(function(item) {
            this._element.appendChild(getElement(item));
        }, this);

        parseChildPanelsOf(this);
        this.layout();
        return this;

    };

    /* unstable */
    dock_n_liquid.createElement = function(whereToDock, parentElement) {

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



    /*
     * module private functions
     */

    function parseChildPanelsOf(panel) {
        panel._children = (function(element, result) {
            var docks = element.getElementsByClassName('dock');
            if(docks && docks.length > 0) {
                Array.from(docks).forEach(function(e) {
                    if(e.parentNode === element) {
                        result.push(new dock_n_liquid(e));
                    }
                });
            }
            return result;
        }(panel._element, []));
        if(panel._children.length > 0) {
            panel._element.classList.add("container");
            panel._isContainer = true;
        } else {
            panel._element.classList.add("content");
        }
    }

    function getRect(panel) {
        var rect = null;
        if(panel._element === document.body) {
            rect = new BBox.Rect(0, 0,
                    parseInt(window.innerWidth),
                    parseInt(window.innerHeight));
            var bboxBody = new BBox(document.body);
            rect.bottom -= bboxBody.marginVerticalNc();
        } else {
            var bbox = new BBox(panel._element);
            rect = BBox.Rect.fromBBox(bbox);
            rect.bottom -=
                bbox.px("border-top-width") +
                bbox.px("border-bottom-width");
        }
        return rect;
    }

    function setRect(panel, rect) {
        panel._element.style.top = rect.top + "px";
        panel._element.style.left = rect.left + "px";
        panel._element.style.right = rect.right + "px";
        panel._element.style.bottom = rect.bottom + "px";
    }

    function panelName(panel) {
        var e = panel._element;
        var id = e.id;
        var c = Array.from(e.classList);
        return e.nodeName +
            (id == "" ? "" : "#" + id) +
            (c.length == 0 ? "" : "." + c.join("."))
    }

    function computedStyleOf(panel) {
        return getComputedStyle(panel._element);
    }

    /**
     * Is the rect's area zero.
     */
    function isRectAreaZero(rect) {
        return rect.top >= rect.bottom || rect.left >= rect.right;
    }

    /**
     * Disappear the panel
     */
    function disappear(panel) {
        panel._disappeared = true;
        panel._element.style.display = "none";
        panel._element.style.visibility = "hidden";
    };

    /**
     * Appear the panel
     */
    function appear(panel) {
        panel._disappeared = false;
        panel._element.style.display = "block";
        panel._element.style.visibility = "visible";
    };

    function getElement(element) {

        if(typeof(element) === "string" &&
            element.charAt(0) === "#")
        {
            var id = element.substr(1);
            return document.getElementById(id);

        }

        return element;

    }

    function rootElementOf(panel) {
        var e = panel._element;
        while(e.parentNode && e.parentNode.classList.contains("dock")) {
            e = e.parentNode;
        }
        return e;
    }

    try {
        module.exports = dock_n_liquid;
    } catch (err) {
        global.dock_n_liquid = dock_n_liquid;
    }

}(Function("return this;")()));

