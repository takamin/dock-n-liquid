(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function(global) {
    "use strict";

    var BBox = require("b-box");
    var fullscrn = require("fullscrn");
    var DOCK_DIR = [ 'top', 'left', 'right', 'bottom' ];

    /**
     * dock_n_liquid class constructor
     * @param {Element} element an element to be created as docking panel.
     * @constructor
     */
    function dock_n_liquid(element) {

        this._element = element;
        this._drag = null;// the drag starting point information

        if(!this._element.classList.contains("dock_n_liquid")) {

            this._element.classList.add("dock_n_liquid");

            this._element.style["box-sizing"] = "border-box";
            this._element.style["position"] = "absolute";
            this._element.style["top"] = "0";
            this._element.style["left"] = "0";
            this._element.style["right"] = "0";
            this._element.style["bottom"] = "0";

            // Set "dragover" event listener
            // to allow a resizing operation by dragging to
            // the top layout panel.
            if(isLayoutTop(this._element)) {
                this.allowChildResize();
            } else if(this.isResizable()) {
                this.createResizer();
            }

            this.updateContainerState();
            var computedStyle = getComputedStyle(this._element);

            if(computedStyle.overflowX == "visible") {
                this._element.style.overflowX = "hidden";
            }
            if(computedStyle.overflowY == "visible") {
                this._element.style.overflowY = "hidden";
            }

            this.layout();
            this.layout();
        }
    }

    /**
     * The docking state to the top.
     * @returns {bool} the state of docking.
     */
    dock_n_liquid.prototype.isTop = function() {
        return this._element.classList.contains("top");
    };

    /**
     * The docking state to the left.
     * @returns {bool} the state of docking.
     */
    dock_n_liquid.prototype.isLeft = function() {
        return this._element.classList.contains("left");
    };

    /**
     * The docking state to the right.
     * @returns {bool} the state of docking.
     */
    dock_n_liquid.prototype.isRight = function() {
        return this._element.classList.contains("right");
    };

    /**
     * The docking state to the bottom.
     * @returns {bool} the state of docking.
     */
    dock_n_liquid.prototype.isBottom = function() {
        return this._element.classList.contains("bottom");
    };

    /**
     * liquid alignment state.
     * @returns {bool} The state.
     */
    dock_n_liquid.prototype.isLiquid = function() {
        return !this.isTop() &&
            !this.isLeft() &&
            !this.isRight() &&
            !this.isBottom();
    };

    /**
     * Update the layout of panel
     * @returns {undefined}
     */
    dock_n_liquid.prototype.layout = function() {

        // No need to align the detached panel
        if(this.isDetached()) {
            return;
        }

        // The range is decreased down to its client width and
        // height by considering for that the scrollbar might be
        // shown.
        var rect = getRect(this);
        while(rect.right - rect.left > this._element.clientWidth) {
            rect.right--;
        }
        while(rect.bottom - rect.top > this._element.clientHeight) {
            rect.bottom--;
        }

        var children = getChildPanelsOf(this);
        var zIndexBase = parseInt(this._element.style["z-index"] || "1");
        zIndexBase += children.length;
        children.forEach(function (child) {

            // No need to align the detached panel
            if(child.isDetached()) {
                return;
            }

            if(!child.disappeared()) {
                var childStyle = getComputedStyle(child._element);
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

            if(child.isTop()) {
                child._element.style.bottom = rect.top + childHeight + "px";
                child._element.style.width =
                    ((rect.right - rect.left)
                     - bboxChild.marginHorizontalNc()) + "px";
                rect.top += childHeight;
            } else if(child.isLeft()) {
                child._element.style.right = rect.left + childWidth + "px";
                child._element.style.height =
                    ((rect.bottom - rect.top)
                     - bboxChild.marginVerticalNc()) + "px";
                rect.left += childWidth;
            } else if(child.isRight()) {
                child._element.style.left = rect.right - childWidth + "px";
                child._element.style.height =
                    ((rect.bottom - rect.top)
                     - bboxChild.marginVerticalNc()) + "px";
                rect.right -= childWidth;
            } else if(child.isBottom()) {
                child._element.style.top = rect.bottom - childHeight + "px";
                child._element.style.width =
                    ((rect.right - rect.left)
                     - bboxChild.marginHorizontalNc()) + "px";
                rect.bottom -= childHeight;
            }

        }, this);
        children.forEach(function (child) {
            if(child.isLiquid()) {
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
        children.forEach(function (child) {
            if(child.isDetached()) {
                child._element.style["z-index"] = zIndexBase + children.length + 1;
            }
        });
        children.forEach(function (child) {
            if(getChildPanelsOf(child).length > 0) {
                child.layout();
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
        var layoutRoot = rootElementOf(this._element);
        var root = dock_n_liquid.select(layoutRoot);
        root.layout();
        root.layout();
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
                if(isLayoutTop(dock) && !rootElements.includes(dock)) {
                    rootElements.push(dock_n_liquid.select(dock));
                }
            });
            return rootElements;
        }([]));

        var alignLayoutAll = function() {
            roots.forEach(function(root) {
                root.layout();
                root.layout();
                if(callback) {
                    callback.call(callbackObject);
                }
            });
        };

        window.addEventListener("resize", function() {
            if(fullscrn.enabled && fullscrn.element != null) {
                if(fullscrn.element.classList.contains("dock"))
                {
                    expandFullscreen(fullscrn.element);
                }
                return;
            }
            alignLayoutAll();
        });

        document.addEventListener("fullscreenchange", function() {
            if(fullscrn.element == null) {
                alignLayoutAll();
            }
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

        this.updateContainerState();

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
     * Disappeared state.
     * @returns {bool} true: disappeared, false: appeared
     */
    dock_n_liquid.prototype.disappeared = function() {
        return this._element.classList.contains("disappeared");
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
        parentPanelOf(element).layout();
        parentPanelOf(element).layout();
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
        var layoutRoot = rootElementOf(element);
        var root = dock_n_liquid.select(layoutRoot);
        root.layout();
        root.layout();
    };

    function parentPanelOf(element, count) {
        var i = 0;
        count = count || 1;
        while(i < count &&
            element.parentNode != null &&
            element.parentNode.nodeType == 1 &&
            element.parentNode.classList.contains("dock"))
        {
            element = element.parentNode;
            i++;
        }
        return dock_n_liquid.select(element);
    }

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

    /**
     * Update the element class by its count of child docks.
     * @returns {undefined}
     */
    dock_n_liquid.prototype.updateContainerState = function() {
        if(this.isLiquid()) {
            this._element.classList.add("liquid");
        } else {
            this._element.classList.remove("liquid");
        }
        var children = getChildPanelsOf(this);
        if(children.length > 0) {
            this._element.classList.add("container");
            this._element.classList.remove("content");
        } else {
            this._element.classList.remove("container");
            this._element.classList.add("content");
        }
    };

    /**
     * Request the dock panel to be fullscreen mode.
     * @param {Element} element A target of the request.
     * @returns {Promise} A promise that resolve the operation is completed.
     */
    dock_n_liquid.requestFullscreen = function(element) {
        if(!fullscrn.enabled) {
            throw new Error("Fullscreen-API is unavailable");
        }
        if(element.classList.contains("dock") &&
            !element.classList.contains("detached"))
        {
            dock_n_liquid.detach(element);
        }
        return element.requestFullscreen().then(function() {
            expandFullscreen(element);
        });
    };

    /**
     * Exit fullscreen mode.
     * @returns {Promise} A promise that resolve the operation is completed.
     */
    dock_n_liquid.exitFullscreen = function() {
        if(!fullscrn.enabled) {
            throw new Error("Fullscreen-API is unavailable");
        }
        if(fullscrn.element.classList.contains("dock") &&
            fullscrn.element.classList.contains("detached"))
        {
            dock_n_liquid.attach(fullscrn.element);
        }
        return document.exitFullscreen();
    };

    function expandFullscreen(e) {
        e.style.top = "0px";
        e.style.left = "0px";
        e.style.right = window.innerWidth + "px";
        e.style.bottom = window.innerHeight + "px";
        e.style.width = window.innerWidth + "px";
        e.style.height = window.innerHeight + "px";
    }

    /*
     * module private functions
     */

    /**
     * Get child panels.
     * @param {dock_n_liquid} panel parent panel.
     * @returns {dock_n_liquid[]} child panels
     */
    function getChildPanelsOf(panel) {
        return (function(docks) {
            Array.from(panel._element.childNodes).forEach(function(node) {
                if(node.nodeType == 1 && node.classList.contains("dock")) {
                    docks.push(new dock_n_liquid(node));
                }
            });
            return docks;
        }([]));
    }

    /**
     * Get rect of panel.
     * @param {dock_n_liquid} panel the panel to get.
     * @returns {BBox.Rect} rect object of panel.
     */
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

    /**
     * Set rect of panel.
     * @param {dock_n_liquid} panel the panel to set.
     * @param {BBox.Rect} rect rectangle to be set.
     * @returns {undefined} rect object of panel.
     */
    function setRect(panel, rect) {
        panel._element.style.top = rect.top + "px";
        panel._element.style.left = rect.left + "px";
        panel._element.style.right = rect.right + "px";
        panel._element.style.bottom = rect.bottom + "px";
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
        if(!panel.disappeared()) {
            panel._element.classList.add("disappeared");
            panel._element.style.display = "none";
            panel._element.style.visibility = "hidden";
        }
    }

    /**
     * Appear the panel
     * @param {dock_n_liquid} panel A target of the operation.
     * @returns {undefined}
     */
    function appear(panel) {
        if(panel.disappeared()) {
            panel._element.classList.remove("disappeared");
            panel._element.style.display = "block";
            panel._element.style.visibility = "visible";
        }
    }

    /**
     * Get DOM element.
     * @param {string|Element} selector the element selector by id
     * @returns {Element} the element that found in DOM tree.
     */
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

    /**
     * Get a top element of layout tree from a specific element.
     * @param {Element} element a starting point of the tree.
     * @returns {Element} top docking panel element.
     */
    function rootElementOf(element) {
        while(element.parentNode && element.parentNode.classList.contains("dock")) {
            element = element.parentNode;
        }
        return element;
    }

    /**
     * Check this is top docking panel of layout tree.
     * @param {Element} element an element to be checked.
     * This is a premise that it is a docking panel.
     * @returns {bool} top or not.
     */
    function isLayoutTop(element) {
        var parentNode = element.parentNode;
        if(!parentNode || parentNode.nodeType != 1 ||
                !parentNode.classList.contains("dock"))
        {
            return true;
        }
        return false;
    }

    /**
     * Width or height of a handle to resize a panel.
     * @type {number}
     */
    var _resizerWidth = 5;

    /**
     * Listen events for a drop target and allow resize operation for the child elements.
     * @return {undefined}
     */
    dock_n_liquid.prototype.allowChildResize = function() {

        // events fired on the drop taget.
        document.addEventListener("dragover", function( event ) {

            // In Firefox to allow the dragging, this is needed.
            // It seems no need in the other browsers.
            event.preventDefault();

        }.bind(this), false);

        document.addEventListener("drop", function( event ) {

            // Unless this, The drop causes the page may go to the
            // meaningless location especially in Firefoxa.
            event.preventDefault();

        }.bind(this), false);

    };

    /**
     * Returns the state of resizing of this panel.
     * @returns {bool} the resizability of this panel.
     */
    dock_n_liquid.prototype.isResizable = function() {
        if(this._element.classList.contains("resizable") &&
                (this.isTop() || this.isLeft() || this.isRight() || this.isBottom()))
        {
            return true;
        }
        return false;
    };

    /**
     * Create resizer handle. It is also dock panel.
     * @returns {undefined}
     */
    dock_n_liquid.prototype.createResizer = function() {

        // Create new client area and append all original child nodes.
        var clientArea = document.createElement("DIV");
        clientArea.classList.add("dock");
        var orgChildNodes = Array.from(this._element.childNodes);
        this._element.appendChild(clientArea);
        orgChildNodes.forEach(function(node) {
            clientArea.appendChild(node);
        });

        // Create a resizer handle.
        var resizer = document.createElement("DIV");
        this._element.appendChild(resizer);
        resizer.classList.add("resizer");

        // The resizer will be initialized as dock_n_liquid
        resizer.classList.add("dock");
        if(this.isTop()) {
            resizer.classList.add("bottom");
            resizer.classList.add("vertical");
            resizer.style.height = _resizerWidth + "px";
        } else if(this.isLeft()) {
            resizer.classList.add("right");
            resizer.classList.add("horizontal");
            resizer.style.width = _resizerWidth + "px";
        } else if(this.isRight()) {
            resizer.classList.add("left");
            resizer.classList.add("horizontal");
            resizer.style.width = _resizerWidth + "px";
        } else if(this.isBottom()) {
            resizer.classList.add("top");
            resizer.classList.add("vertical");
            resizer.style.height = _resizerWidth + "px";
        }

        // Setup as draggable
        resizer.setAttribute("draggable", "true");
        resizer.addEventListener("dragstart",
                this.resizerDragStart.bind(this), false);
        resizer.addEventListener("dragend",
                this.resizerDragEnd.bind(this), false);
        resizer.addEventListener("drag",
                this.resizerDrag.bind(this), false);

    };

    /**
     * dragstart event handler for the resizer.
     * @param {Event} event event object
     * @returns {undefined}
     */
    dock_n_liquid.prototype.resizerDragStart = function(event) {

        event.dataTransfer.effectAllowed = "move";

        // Set dummy dragging data.
        // Essentially the dragging will not start without data.
        // Firefox accept null as the data, but Edge does not.
        // And Chrome does not need this invocation.
        event.dataTransfer.setData('text/plain', "");

        // Store informations of starting point of dragging
        // offset X / Y is not legal. Use screen X / Y.
        this._drag = {
            "startX": event.screenX,
            "startY": event.screenY,
            "width": parseInt(this._element.style.right) -
                    parseInt(this._element.style.left),
            "height": parseInt(this._element.style.bottom) -
                    parseInt(this._element.style.top),
        };
        event.target.classList.add("resizing");
        event.stopPropagation();

    };

    /**
     * dragend event handler for the resizer.
     * @param {Event} event event object
     * @returns {undefined}
     */
    dock_n_liquid.prototype.resizerDragEnd = function(event) {

        this.resizeByDragEvent(event);
        this._drag = null;
        event.target.classList.remove("resizing");
        event.stopPropagation();
        event.preventDefault();
    };

    /**
     * drag event handler for the resizer.
     * @param {Event} event event object
     * @returns {undefined}
     */
    dock_n_liquid.prototype.resizerDrag = function( event ) {
        event.stopPropagation();
    };

    /**
     * Resize the panel by dragend event.
     * @param {Event} event event object
     * @returns {undefined}
     */
    dock_n_liquid.prototype.resizeByDragEvent = function(event) {

        // offset X / Y is not legal. Use screen X / Y.
        var dx = event.screenX - this._drag.startX;
        var dy = event.screenY - this._drag.startY;
        var layoutRoot = rootElementOf(this._element);

        var astyle = getComputedStyle(this._element);
        var h = parseInt(astyle.height);
        var w = parseInt(astyle.width);
        var root = dock_n_liquid.select(layoutRoot);

        if(this.isTop()) {
            this._element.style.height = (h + dy) + "px";
        } else if(this.isLeft()) {
            this._element.style.width = (w + dx) + "px";
        } else if(this.isRight()) {
            this._element.style.width = (w - dx) + "px";
        } else if(this.isBottom()) {
            this._element.style.height = (h - dy) + "px";
        }
        root.layout();
        root.layout();
        window.dispatchEvent(new Event("resize"));
    }


    try {
        module.exports = dock_n_liquid;
    } catch (err) { /* ignore */}
    global.dock_n_liquid = dock_n_liquid;

}(Function("return this;")()));


},{"b-box":2,"fullscrn":3}],2:[function(require,module,exports){
(function(global) {
    "use strict";

    function BBox(element) {
        this._element = element;
        this._element.addEventListener("resize", function() {
            this.update();
        }.bind(this));
        this.update();
    }

    BBox.LengthKeys = [
        "top",
        "left",
        "right",
        "bottom",
        "width",
        "height",
        "margin-top",
        "margin-left",
        "margin-right",
        "margin-bottom",
        "padding-top",
        "padding-left",
        "padding-right",
        "padding-bottom",
        "border-top-width",
        "border-left-width",
        "border-right-width",
        "border-bottom-width",
    ];

    BBox.prototype.update = function() {
        this._style = getComputedStyle(this._element, "");
        BBox.LengthKeys.forEach(function(key) {
            if(key in this._style) {
                this[key] = this._style[key];
            } else {
                throw new Error(["The key", key,
                    "is not exist in computedStyle"
                    ].join(" "))
            }
        }, this);
        /*
        console.log(JSON.stringify(this, function(key, value) {
            if(typeof(value) === "object"
                && value.constructor.name.substr(-7) === "Element"
                && "id" in value && "classList" in value)
            {
                return value.tagName +
                    (value.id !== "" ? "#" + value.id : "") +
                    (value.classList.length == 0 ? "" : "." +
                     Array.prototype.join.call(value.classList, "."));
            }
            if(key.charAt(0) == "_") {
                return "";
            }
            return value;
        }));
        */
    };

    BBox.prototype.px = function(key) {
        if(!(key in this)) {
            throw new Error([key, "is not exists in",
                    JSON.stringify(this)
                    ].join(" "));
        }
        return parseInt(this[key]);
    };

    BBox.prototype.marginTopNc = function() {
        return this.px("margin-top") +
            this.px("padding-top");
    };

    BBox.prototype.marginLeftNc = function() {
        return this.px("margin-left") +
            this.px("padding-left");
    };

    BBox.prototype.marginRightNc = function() {
        return this.px("margin-right") +
            this.px("padding-right");
    };

    BBox.prototype.marginBottomNc = function() {
        return this.px("margin-bottom") +
            this.px("padding-bottom");
    };

    BBox.prototype.marginVerticalNc = function() {
        return this.marginTopNc() +
            this.marginBottomNc();
    };

    BBox.prototype.marginHorizontalNc = function() {
        return this.marginLeftNc() +
            this.marginRightNc();
    };

    BBox.prototype.setBound = function(rect) {
        this._element.style.top = rect.top + "px";
        this._element.style.left = rect.left + "px";
        this._element.style.right = rect.right + "px";
        this._element.style.bottom = rect.bottom + "px";
    };

    BBox.prototype.getSize = function() {
        var rect = BBox.Rect.fromBBox(this);
        return new BBox.Size(
            rect.right - rect.left,
            rect.bottom - rect.top);
    };

    function Size(w,h) {
        this._w = w;
        this._h = h;
    }

    BBox.Size = Size;

    Size.prototype.getAspectRatio = function() {
        return this._w / this._h;
    };
    Size.prototype.getMaxInscribedSize = function(naturalSize) {
        var aspect = naturalSize.getAspectRatio();
        if(aspect < this.getAspectRatio()) {
            return new Size(Math.round(this._h * aspect), this._h);
        } else {
            return new Size(this._w, Math.round(this._w / aspect));
        }
    };
    Size.prototype.applyElementAttributeSize = function(element) {
        element.setAttribute("width", this._w + "px");
        element.setAttribute("height", this._h + "px");
    };

    function Rect(top, left, right, bottom) {
        this.top = top || 0;
        this.left = left || 0;
        this.right = right || 0;
        this.bottom = bottom || 0;
    };

    BBox.Rect = Rect;

    Rect.clone = function (that) {
        return new Rect(that.top, that.left, that.right, that.bottom);
    };

    Rect.fromBBox = function(bbox) {
        return new Rect(
            bbox.marginTopNc(),
            bbox.marginLeftNc(),
            bbox.marginLeftNc() + bbox.px("width") - bbox.marginRightNc(),
            bbox.marginTopNc() + bbox.px("height") - bbox.marginBottomNc());
    };

    try {
        module.exports = BBox;
    } catch (err) {
        global.BBox = BBox;
    }
}(Function("return this;")()));



},{}],3:[function(require,module,exports){
(function() {
    "use strict";

    var GLOBAL = Function("return this;")();

    var WebDLog = (function() {
        try { return require("web-dlog"); }
        catch(e) { /*ignore*/ }
        return GLOBAL.WebDLog;
    }());
    var _debugMode = false;
    var Log = WebDLog.logger().debug( _debugMode );

    /**
     * The class to be exported.
     * There is no instance method.
     * @constructor
     */
    var Fullscreen = function() {}

    /**
     * Indicates the state that Fullscreen API is available.
     *
     * This is same to 'fullscreenEnabled'
     *
     * @type {?bool}
     */
    Fullscreen.enabled = null;

    /**
     * References to the full screen element
     *
     * This is same to 'fullscreenElement'
     *
     * @type {?Element}
     */
    Fullscreen.element = null;

    /**
     * Requests to the element to be full screen.
     *
     * This is same to 'Element.requestFullscreen()'
     *
     * @param {!Element} element The element to expand.
     * @returns {Promise} a Promise that will be resolved
     * when the operation completes
     */
    Fullscreen.request = function(element) {
        console.warn("Waiting requestFullscreen implementation.");
        return element.requestFullscreen();
    };

    /**
     * Exit from full screen mode
     *
     * This is same to 'Document.exitFullscreen()'
     *
     * @returns {Promise} a Promise that will be resolved
     * when the operation completes
     */
    Fullscreen.exit = function() {
        console.warn("Waiting exitFullscreen implementation");
        return document.exitFullscreen();
    };

    /*
     * no standard properties
     */
    Fullscreen.fullscreen = null;
    Fullscreen.fullScreen = null;
    Fullscreen.isFullscreen = null;
    Fullscreen.isFullScreen = null;

    /**
     * Change debugging mode
     * @param {?bool} enabled enabled or not
     * @returns {bool|undefined}
     *      If the argument is not set,
     *      the current status is returned,
     *      otherwise undefined.
     */
    Fullscreen.debugMode = function(enabled) {
        if(enabled == null) {
            return _debugMode;
        }
        _debugMode = enabled;
        Log.debug(enabled);
    };

    try {
        module.exports = Fullscreen;
    } catch (err) { /* ignore */ }

    GLOBAL.Fullscreen = Fullscreen;


    /*
     * Search APIs
     */

    (function() {

        var d = document;
        var api = Fullscreen;
        var $ = (function() {
            try { return require("./lib/document-ready"); }
            catch(err) { /* ignore the error */ }
            return ("DocumentReady" in GLOBAL) ?
                GLOBAL.DocumentReady : (function(func) { func(); });
        }());

        var getMethod = function(cls, names) {
            for(var i = 0; i < names.length; i++) {
                var name = names[i];
                if(name in cls.prototype) {
                    Log.d("The class " + cls.name + " has a method " + name + ".");
                    return cls.prototype[name];
                }
                Log.d("The class " + cls.name + " does not have a method " + name + ".");
            }
            Log.d("The class " + cls.name + " does not have a method " + names.join(',') + " at all.");
            return null;
        };

        var getPropName = function(names) {
            for(var i = 0; i < names.length; i++) {
                var name = names[i];
                if(name in d) {
                    Log.d("The document has a property " + name + ".");
                    return name;
                }
                Log.d("The document does not have a property " + name + ".");
            }
            Log.d("The document does not have a property " + names.join(',') + " at all.");
            return null;
        };

        $(function() {

            var callbackChange = null;

            //
            // Debug print members matching /fullscreen/i
            //
            var logFullscreenMemberOf = function(cls) {
                Object.keys(cls.prototype).forEach(function(key) {
                    if(key.match(/fullscreen/i)) {
                        Log.d("Found " + cls.name + ".prototype." + key);
                    }
                });
            };
            try { logFullscreenMemberOf(Document); } catch(err) { /* nothing */ }
            try { logFullscreenMemberOf(Element);  } catch(err) { /* nothing */ }

            //
            // Determine fullscreenEnabled
            //
            api.enabled = (function() {
                var name = getPropName([
                    "fullscreenEnabled",
                    "webkitFullscreenEnabled",
                    "webkitFullScreenEnabled",
                    "mozFullScreenEnabled"
                ]);
                var value = (name==null)? false : d[name];
                return value;
            }());
            Log.d("Fullscreen.enabled:", api.enabled);

            // Inject Document.fullscreenEnabled
            if(!("fullscreenEnabled" in document)) {
                d.fullscreenEnabled = api.enabled;
            }


            //
            // Updates Document.fullscreenElement and
            // Document.fullscreen by listening fullscreenchage event.
            //
            (function() {
                var injectElement = !("fullscreenElement" in d);
                var injectFullscreen = !("fullscreen" in d);
                var nameFullscreenElement = getPropName([
                    "fullscreenElement",
                    "webkitFullscreenElement",
                    "mozFullScreenElement"
                ]);
                var nameFullscreen = getPropName([
                    "fullscreen",
                    "webkitIsFullScreen",
                    "webkitIsFullscreen",
                    "mozFullScreen"
                ]);

                /**
                 * The function to update `Document.fullscreenElement`.
                 * This is invoked from the `fullscreenchange` event handler
                 * @returns {undefined}
                 */
                var updateProperty = function() {
                    api.element =
                    (function() {
                        var value = (nameFullscreenElement == null) ?
                            null : d[nameFullscreenElement];
                        Log.d("Updates Fullscreen.element to " + value);
                        return value;
                    }());
                    Log.d("Fullscreen.element: " + api.element);
                    if(injectElement) {
                        d.fullscreenElement = api.element;
                        Log.d("Document.fullscreenElement:" + d.fullscreenElement);
                    }

                    /*
                     * These members are available, but not standard.
                     */
                    api.fullscreen =
                    api.fullScreen =
                    api.isFullscreen =
                    api.isFullScreen =
                    (function() {
                        var value = (nameFullscreen == null)?
                            (api.element != null): d[nameFullscreen];
                        Log.d("Updates Fullscreen.fullscreen to ", value);
                        return value;
                    }());
                    Log.d("Fullscreen.fullscreen:", api.fullscreen);
                    if(injectFullscreen) {
                        d.fullscreen = api.fullscreen;
                        Log.d("Document.fullscreen:", d.fullscreen);
                    }
                };

                updateProperty(); // Initialize the properties

                (function() {
                    var standardType = "fullscreenchange";
                    var implementedType = null;

                    /**
                     * fullscreenchange event handler
                     * @param {Event} event a notified event
                     * @returns {undefined}
                     */
                    var onfullscreenchange = function(event) {

                        if(implementedType == null) {
                            implementedType = event.type;
                            Log.d("implemented", standardType + ":", implementedType);
                        } else if(event.type != implementedType) {
                            return;
                        }

                        updateProperty();

                        if(implementedType != standardType) {
                            Log.d("Route event", event.type, "to", standardType);
                            d.dispatchEvent(new Event(standardType));
                        }

                        if(callbackChange != null) {
                            callbackChange(null, true);
                            callbackChange = null;
                        }
                    };
                    d.addEventListener(standardType, onfullscreenchange);
                    d.addEventListener("webkitfullscreenchange", onfullscreenchange);
                    d.addEventListener("mozfullscreenchange", onfullscreenchange);
                }());
            }());

            //
            // Route prefixed fullscreenerror event to standard
            //
            (function() {
                var standardType = "fullscreenerror";
                var implementedType = null;
                /**
                 * fullscreenerror event handler
                 * @param {Event} event a notified event
                 * @returns {undefined}
                 */
                var onfullscreenerror = function(event) {

                    if(implementedType == null) {
                        implementedType = event.type;
                        Log.d("implemented", standardType + ":", implementedType);
                    } else if(event.type != implementedType) {
                        return;
                    }
                    if(implementedType != standardType) {
                        Log.d("Route event", event.type, "to", standardType);
                        d.dispatchEvent(new Event(standardType));
                    }

                    if(callbackChange != null) {
                        callbackChange(new Error("fullscreen API error"), false);
                        callbackChange = null;
                    }
                };
                d.addEventListener(standardType, onfullscreenerror);
                d.addEventListener("webkitfullscreenerror", onfullscreenerror);
                d.addEventListener("mozfullscreenerror", onfullscreenerror);
            }());

            var runFullscreenRequest = function(requestPromise) {
                /* globals Promise */
                return new Promise(function(resolve, reject) {
                    try {
                        if(callbackChange != null) {
                            Log.d("an unresolved request exists");
                            reject(new Error("an unresolved request exists"));
                        } else {
                            callbackChange = function(err, data) {
                                if(err) {
                                    Log.d("Promise rejected.");
                                    reject(err);
                                } else {
                                    Log.d("Promise resolved.");
                                    resolve(data);
                                }
                            };
                            var promise = requestPromise();
                            if(promise != null) {
                                Log.d("API returns Promise");
                                promise.then(function(){
                                    Log.d("Promise that API returns resolved.");
                                    resolve();
                                }).catch(function(err) {
                                    Log.d("Promise that API returns rejected.");
                                    reject(err);
                                });
                            }
                        }
                    } catch(err) {
                        reject(err);
                    }
                });
            };
            //
            // Fullscreen.request()
            //
            api.request = (function() {
                var method = getMethod(Element, [
                    "webkitRequestFullScreen",
                    "mozRequestFullScreen",
                    "requestFullScreen",
                    "requestFullscreen"
                ]);
                if(method == null) {
                    return function() {
                        throw new Error("requestFullscreen() is not supported.");
                    };
                }
                return function(element) {
                    Log.d("Fullscreen.request:", element);
                    return runFullscreenRequest(function() {
                        return method.call(element);
                    });
                };
            }());

            //
            // Inject `Element.requestFullscreen`
            //
            if(!("requestFullscreen" in Element.prototype)) {
                Log.d("Inject Element.requestFullscreen()");
                Element.prototype.requestFullscreen = function() {
                    Log.d("This is an injected Element.requestFullscreen()");
                    return api.request(this);
                };
            }

            //
            // Fullscreen.exit()
            //
            api.exit = (function() {
                var method = getMethod(Document, [
                    "webkitCancelFullScreen",
                    "mozCancelFullScreen",
                    "exitFullScreen",
                    "exitFullscreen"
                ]);
                if(method == null) {
                    return function() {
                        throw new Error("Document.exitFullscreen() is not supported.");
                    };
                }
                return function() {
                    Log.d("Fullscreen.exit:", api.element);
                    if(api.element == null) {
                        return new Promise(function(resolve, reject) {
                            reject(new Error("Fullscreen.element not exists"));
                            //resolve();
                        });
                    }
                    return runFullscreenRequest(function() {
                        return method.call(d);
                    });
                };
            }());

            //
            // Inject `Document.exitFullscreen`
            //
            if(!("exitFullscreen" in Document.prototype)) {
                Log.d("Inject Document.exitFullscreen()");
                Document.prototype.exitFullscreen = function() {
                    Log.d("This is an injected Document.exitFullscreen()");
                    return api.exit();
                };
            }

        });
    }());

}());

},{"./lib/document-ready":4,"web-dlog":5}],4:[function(require,module,exports){
(function() {
    "use strict";

    var WebDLog = (function() {
        try { return require("./web-dlog"); } catch(e) {/*ignore*/ }
        return GLOBAL.WebDLog; }());
    var Log = WebDLog.logger().debug(false);

    var DocumentReady = function(func) {
        if(waiting) {
            Log.d("Save a DocumentReady function to run later");
            funcList.push(func);
        } else {
            Log.d("Run a DocumentReady function immediate");
            exec(func);
        }
    };
    var waiting = true;
    var funcList = [];
    var exec = function(func) {
        try {
            Log.d("Run a DocumentReady function." + func);
            func();
        } catch(err) {
            console.error(err.message);
            console.error(err.stack);
        }
    };
    var GLOBAL = Function("return this;")();

    try {
        module.exports = DocumentReady;
    } catch (err) {
        GLOBAL.DocumentReady = DocumentReady;
    }

    (function() {
        var waitTime = 10;
        var waitTotal = 0;
        var waitLimit = 10000;
        var runAllFunc = function() {
            Log.d("Run all the saved DocumentReady functions");
            funcList.forEach(function(func) {
                exec(func);
            });
            funcList = [];
        };
        var waitDocument = function() {
            Log.d("Check the document is ready.");
            if("document" in GLOBAL) {
                Log.d("The document is available.");
                if(document.readyState === "complete" ||
                    (document.readyState !== "loading" &&
                    !document.documentElement.doScroll))
                {
                    Log.d("The DOMContentLoaded event was already fired.");
                    runAllFunc();
                    waiting = false;
                } else {
                    Log.d("Listen DOMContentLoaded event.");
                    document.addEventListener(
                        "DOMContentLoaded", function(){
                            Log.d("Handle the DOMContentLoaded.");
                            runAllFunc();
                            waiting = false;
                        });
                }
            } else if(waitTotal < waitLimit) {
                Log.d("The document is not available.");
                setTimeout(function() {
                    waitTotal += waitTime;
                    waitDocument();
                }, waitTime);
            } else {
                console.error("DocumentReady timeout");
                runAllFunc();
                waiting = false;
            }
        };
        waitDocument();
    }());

}());

},{"./web-dlog":5}],5:[function(require,module,exports){
(function() {
    "use strict";
    var GLOBAL = Function("return this;")();
    var WebDLog = function() { };
    var _logger = {
        "debug" : function() {
            console.log(Array.from(arguments).join(' '));
        },
        "ndebug" : function() { },
    }
    WebDLog.logger = function() { return new WebDLog(); };
    WebDLog.prototype.d = _logger["ndebug"];
    WebDLog.prototype.debug = function(debug) {
        if(debug == null) {
            debug = true;
        }
        this.d = _logger[debug?"debug":"ndebug"];
        return this;
    };

    try {
        module.exports = WebDLog;
    } catch (err) {
        GLOBAL.WebDLog = WebDLog;
    }
}());

},{}]},{},[1]);
