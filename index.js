(function(global) {
    "use strict";

    var BBox = require("b-box");
    var DOCK_DIR = [ 'top', 'left', 'right', 'bottom' ];

    function dock_n_liquid(element) {

        this._element = element;

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
        var layoutRoot = rootElementOf(this);
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

    /*
     * module private functions
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

    /**
     * Check this is top docking panel of layout tree.
     * @param {Element} element an element to be checked.
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
     * Listen "dragover" event and allow resize operation for the child elements.
     * @return {undefined}
     */
    dock_n_liquid.prototype.allowChildResize = function() {
        this._element.addEventListener("dragover",
                function(event) {
                    console.log(event.dataTransfer.types.join(", "));
                    event.preventDefault();
                    return false;
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
        this._drag = {
            "startX": event.offsetX,
            "startY": event.offsetY,
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
        event.target.classList.remove("resizing");
        event.stopPropagation();
        event.preventDefault();
    };

    /**
     * drag event handler for the resizer.
     * @param {Event} event event object
     * @returns {undefined}
     */
    dock_n_liquid.prototype.resizerDrag = function() {
        event.stopPropagation();
    };

    /**
     * Resize the panel by dragend event.
     * @param {Event} event event object
     * @returns {undefined}
     */
    dock_n_liquid.prototype.resizeByDragEvent = function(event) {

        var dx = event.offsetX - this._drag.startX;
        var dy = event.offsetY - this._drag.startY;
        var layoutRoot = rootElementOf(this);

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
    }


    try {
        module.exports = dock_n_liquid;
    } catch (err) { /* ignore */}
    global.dock_n_liquid = dock_n_liquid;

}(Function("return this;")()));

