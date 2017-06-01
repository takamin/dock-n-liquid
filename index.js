(function(global) {
    "use strict";

    var BBox = require("b-box");
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
     * @returns {undefined}
     */
    dock_n_liquid.prototype.layout = function() {

        // No need to align the detached panel
        if(this.isDetached()) {
            return;
        }

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
        this._children.forEach(function (child) {

            // No need to align the detached panel
            if(child.isDetached()) {
                return;
            }

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
     * @param {bool} visibilityState New visibility state
     * @returns {undefined}
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
     * ```
     * var dock_n_liquid = require("dock-n-liquid");
     *
     * dock_n_liquid.select("#the-root-panel");
     * // or
     * dock_n_liquid.select(document.getElementById("the-root-panel"));
     * ```
     *
     * @param {Element|string} element reference the panel elements.
     * @returns {dock_n_liquid} The created instance referencing the element.
     */
    dock_n_liquid.select = function(element) {
        return new dock_n_liquid(getElement(element));
    };

    /**
     * Initialize 'Dock-n-Liquid' panels.
     * The layout of those are updated when the window is resized.
     *
     * @param {Function} callback A function to be invoked after the window is resized.
     * @param {object} callbackObject A context of the callback.
     * @returns {undefined}
     */
    dock_n_liquid.init = function(callback, callbackObject) {
        var roots = (function(rootElements) {
            Array.from(document.getElementsByClassName("dock"))
            .forEach(function(dock) {
                if(dock.parentNode && dock.parentNode.nodeType == 1 &&
                    !dock.parentNode.classList.contains("dock") &&
                    !rootElements.includes(dock))
                {
                    rootElements.push(dock_n_liquid.select(dock));
                }
            });
            return rootElements;
        }([]));

        window.addEventListener("resize", function() {
            roots.forEach(function(root) {
                root.layout();
                root.layout();
                if(callback) {
                    callback.call(callbackObject);
                }
            });
        });

        window.dispatchEvent(new Event("resize"));

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

    /**
     * Detach the specific element from layout tree.
     * @param {Element|string} selector Identify the element.
     * @returns {undefined}
     */
    dock_n_liquid.detach = function(selector) {
        var element = getElement(selector);
        if(!element.classList.contains("dock")) {
            throw new Error("Not dock_n_liquid element");
        }
        element.classList.add("detached");
        window.dispatchEvent(new Event("resize"));
    };

    /**
     * Attach the element to its layout tree
     * @param {Element|string} selector Identify the element.
     * @returns {undefined}
     */
    dock_n_liquid.attach = function(selector) {
        var element = getElement(selector);
        if(!element.classList.contains("dock")) {
            throw new Error("Not dock_n_liquid element");
        }
        element.classList.remove("detached");
        window.dispatchEvent(new Event("resize"));
    };

    /**
     * Check if this panel is detached.
     * @returns {bool} detached or not.
     */
    dock_n_liquid.prototype.isDetached = function() {
        return dock_n_liquid.detached(this._element);
    };

    /**
     * Check if this panel is detached.
     * @param {Element|string} selector Identify the element
     * @returns {bool} detached or not.
     */
    dock_n_liquid.detached = function(selector) {
        var element = getElement(selector);
        if(!element.classList.contains("dock")) {
            throw new Error("Not dock_n_liquid element");
        }
        return element.classList.contains("detached");
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

    function computedStyleOf(panel) {
        return getComputedStyle(panel._element);
    }

    /**
     * Is the rect's area zero.
     * @param {BBox.Rect} rect rect to be checked
     * @returns {bool} true if the rect's area is zero or false.
     */
    function isRectAreaZero(rect) {
        return rect.top >= rect.bottom || rect.left >= rect.right;
    }

    /**
     * Disappear the panel
     * @param {dock_n_liquid} panel A target of the operation.
     * @returns {undefined}
     */
    function disappear(panel) {
        panel._disappeared = true;
        panel._element.style.display = "none";
        panel._element.style.visibility = "hidden";
    }

    /**
     * Appear the panel
     * @param {dock_n_liquid} panel A target of the operation.
     * @returns {undefined}
     */
    function appear(panel) {
        panel._disappeared = false;
        panel._element.style.display = "block";
        panel._element.style.visibility = "visible";
    }

    function getElement(selector) {

        var element = null;
        if(typeof(selector) === "string") {
            if(selector.charAt(0) === "#") {
                var id = selector.substr(1);
                element = document.getElementById(id);
            }
        } else if(typeof(selector) === "object") {
            if("tagName" in selector) {
                element = selector;
            }
        }
        if(element == null) {
            throw new Error("The element is not found.");
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
    } catch (err) { /* ignore */}
    global.dock_n_liquid = dock_n_liquid;

}(Function("return this;")()));

