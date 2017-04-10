(function(global) {
    "use strict";
    var BBox = require("b-box");

    function each(arr, handler, obj) {
        for(var i = 0; i < arr.length; i++) {
            handler.call(obj, arr[i], i, arr);
        }
    }
    var DOCK_DIR = [ 'top', 'left', 'right', 'bottom' ];
    function LayoutElement(element) {

        this._element = element;
        this._containerRect = null;
        this._isContent = null;
        this._isContainer = null;

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

        this._children = LayoutElement.parseChildren(element);
        if(this._children.length > 0) {
            this._isContainer = true;
        }
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
        }
    };

    LayoutElement.parseChildren = function(element) {
        var dock_elements = element.getElementsByClassName('dock');
        var result = [];
        if(dock_elements && dock_elements.length > 0) {
            each(dock_elements, function(dock_element) {
                if(dock_element.parentNode === element) {
                    result.push(new LayoutElement(dock_element));
                }
            });
        }
        return result;
    };

    LayoutElement.prototype.layout = function() {
        var rect = BBox.Rect.clone(this._containerRect);
        this._children.forEach(function (child, i) {
            var bboxChild = new BBox(child._element);
            var childWidth = bboxChild.px("width") + bboxChild.marginHorizontalNc();
            var childHeight = bboxChild.px("height") + bboxChild.marginVerticalNc();
            child.setBound(rect);
            if(child._element.style.display == "none" ||
            child._element.style.visibility == "hidden")
            {
                return;
            }
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
                child.layout();
            }
        });
    };

    LayoutElement.prototype.setBound = function(rect) {
        this._element.style.top = rect.top + "px";
        this._element.style.left = rect.left + "px";
        this._element.style.right = rect.right + "px";
        this._element.style.bottom = rect.bottom + "px";
    };

    try {
        module.exports = LayoutElement;
    } catch (err) {
        global.LayoutElement = LayoutElement;
    }
}(Function("return this;")()));

