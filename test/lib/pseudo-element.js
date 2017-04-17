(function() {
    function PseudoClassList() {
        this._list = [];
    }

    PseudoClassList.prototype.add = function(className) {
        if(this._list.indexOf(className) < 0) {
            this._list.push(className);
        }
    };

    function PseudoElement(tagName) {
        this._tagName = tagName;
        this.classList = new PseudoClassList();
        this._childNodes = [];
    }

    PseudoElement.prototype.appendChild = function(element) {
        this._childNodes.push(element);
    }

    function PseudoWindow() {
        this.innerWidth = 100;
        this.innerHeight = 200;
    }

    function PseudoDocument() {
        this.body = new PseudoElement("BODY");
    }

    PseudoDocument.prototype.createElement = function(tagName) {
        return new PseudoElement(tagName);
    };

    (function(global) {
        global.window = new PseudoWindow();
        global.document = new PseudoDocument();
    }(Function("return this;")()));

    module.exports = {
        Element: PseudoElement,
        Window: PseudoWindow,
        Document: PseudoDocument,
    };

}());
