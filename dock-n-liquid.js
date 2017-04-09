(function(global) {
    "use strict";
    var BBox = require("b-box");

    function each(arr, handler, obj) {
        for(var i = 0; i < arr.length; i++) {
            handler.call(obj, arr[i], i, arr);
        }
    }

    function LayoutElement(element, rect) {
        element.style["box-sizing"] = "border-box";
        this._element = element;
        this._containerRect = null;
        this.updateRect(rect);

        ['container', 'top', 'left', 'right', 'bottom', 'content'].
        forEach(function(clsnam) {
            var f = [
                "_is", clsnam.charAt(0).toUpperCase(),
                clsnam.slice(1)
            ].join('');
            this[f] = element.classList.contains(clsnam);
        }, this);

        this._children = LayoutElement.parseChildren(element);
    }
    LayoutElement.prototype.updateRect = function(rect) {
        if(rect == null) {
            rect = LayoutElement.getInnerRect(this._element);
        }
        this._containerRect = rect;
    };
    LayoutElement.getInnerRect = function(element) {
        if(element === window) {
            return new BBox.Rect(0, 0,
                    parseInt(window.innerWidth),
                    parseInt(window.innerHeight));
        }
        var bbox = new BBox(element);
        return BBox.Rect.fromBBox(bbox);
    };

    LayoutElement.parseChildren = function(element) {
        var dock_elements = element.getElementsByClassName('dock');
        var result = [];
        if(dock_elements) {
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
            if(child._isTop) {
                child._element.style.bottom = rect.top + childHeight + "px";
                rect.top += childHeight;
            } else if(child._isLeft) {
                child._element.style.right = rect.left + childWidth + "px";
                rect.left += childWidth;
            } else if(child._isRight) {
                child._element.style.left = rect.right - childWidth + "px";
                rect.right -= childWidth;
            } else if(child._isBottom) {
                child._element.style.top = rect.bottom - childHeight + "px";
                rect.bottom -= childHeight;
            } else if(!child._isContent) {
                throw new Error("No class specified for docking direction or cotnent");
            }
        }, this);
        this._children.forEach(function (child) {
            if(child._isContent) {
                child.setBound(rect);
                var bboxChild = new BBox(child._element);
                child._element.style.height = ((rect.bottom - rect.top) - bboxChild.marginVerticalNc()) + "px";
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

