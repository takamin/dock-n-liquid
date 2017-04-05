(function(global) {
    "use strict";

    function BBox(element) {
        this._element = element;
        this.update();
    }

    BBox.LengthKeys = [
        "margin-left",
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
    function Rect(top, left, right, bottom) {
        this.top = top || 0;
        this.left = left || 0;
        this.right = right || 0;
        this.bottom = bottom || 0;
    }
    Rect.clone = function (that) {
        return new Rect(that.top, that.left, that.right, that.bottom);
    };
    LayoutElement.getInnerRect = function(element) {
        if(element === window) {
            return new Rect(0, 0,
                    parseInt(window.innerWidth),
                    parseInt(window.innerHeight));
        }
        var bbox = new BBox(element);
        return new Rect(
            bbox.marginTopNc(),
            bbox.marginLeftNc(),
            bbox.marginLeftNc() + bbox.px("width") - bbox.marginRightNc(),
            bbox.marginTopNc() + bbox.px("height") - bbox.marginBottomNc());
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
        var rect = Rect.clone(this._containerRect);
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
        global.BBox = BBox;
    }
}(Function("return this;")()));

