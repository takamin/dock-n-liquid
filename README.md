DOCK'n'LIQUID - npm `dock-n-liquid`
===================================

This module allows a block element to dock to its container recursively and helps the liquid design.

APIs
----

### CLASS

* `dock_n_liquid` - enables a simple liquid layout.
The instance references a single html element which is the root of docking structure.
The static method 'select' creates and returns an instance of this class.

### STATIC METHOD

* `dock_n_liquid.init()` - initializes all 'dock' elements.
* `dock_n_liquid.select(element)` - selects a html element and returns `dock_n_liquid` instance.
* `dock_n_liquid.select(element)` - selects a html element and returns `dock_n_liquid` instance.

### INSTANCE METHOD

* `dock_n_liquid.show(state)` - shows or hides the panel.

AVAILABLE CLASS NAME for HTML ELEMENT
-------------------------------------

* `dock` - declares the element is the panel.
* `top` -  declares the element docks to the top of the parent element. the `height` style or attribute must be specified.
* `left` - docks to the left. `width` must be specified.
* `right` - to the right. `width` must be specified.
* `bottom` - tothe bottom. `height` required.

EXAMPLE
-------

```html
<html>
    <head>
        <style>
        .dock {
            border-style: solid;
            border-top-color: #eee;
            border-left-color: #eee;
            border-right-color: #444;
            border-bottom-color: #444;
            border-top-width: 1px;
            border-left-width: 1px;
            border-right-width: 1px;
            border-bottom-width: 1px;
            margin:0; padding:0;
            overflow-x:hidden;
            overflow-y:auto;
            color:#ccc;
        }
        .dock.top { background-color: #226; }
        .dock.bottom { background-color: #442; }
        .dock.left { background-color: #244; }
        .dock.right { background-color: #888; }
        </style>
    </head>
    <body onload="main();">
    <div class="dock">
        <div class="dock top" style="height: 60px;">
            <h1>Docking to the top</h1>
        </div>
        <div class="dock left" style="width:120px;">
            <div class="dock top" style="height:20px;">menu#1</div>
            <div class="dock top" style="height:20px;">menu#2</div>
            <div class="dock top" style="height:20px;">menu#3</div>
            <div class="dock top" style="height:20px;">menu#4</div>
            <div class="dock top" style="height:20px;">menu#5</div>
        </div>
        <div id="panelRight" class="dock right"
            style="width:120px;overflow-y:auto">
            <div class="dock top" style="height:20px;">content#1</div>
            <div class="dock top" style="height:20px;">content#2</div>
            <div class="dock top" style="height:20px;">content#3</div>
            <div class="dock top" style="height:20px;">content#4</div>
            <div class="dock top" style="height:20px;">content#5</div>
        </div>
        <div class="dock">
            The Content that occupies the rest of client area.
            <button type="button" onclick="hidePanelRight();">hide panel right</button>
            <button type="button" onclick="showPanelRight();">show panel right</button>
        </div>
        <div class="dock bottom" style="height:40px;">
            MIT LICENSE
        </div>
    </div>
    <script src="../node_modules/b-box/b-box.js"></script>
    <script src="../dock-n-liquid.js"></script>
    <script>
    function main() {
        dock_n_liquid.init();
    }
    function hidePanelRight() {
        var panelRight = document.getElementById("panelRight");
        dock_n_liquid.select(panelRight).show(false);
    }
    function showPanelRight() {
        dock_n_liquid.select("#panelRight").show(true);
    }
    </script>
    </body>
</html>
```

LICENSE
-------

This software is released under the MIT License, see [LICENSE](LICENSE)
