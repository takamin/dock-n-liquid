function testLayout(rootElement) {
    "use strict";
    var layoutRoot = new LayoutElement(rootElement);
    layoutRoot.updateRect();
    layoutRoot.layout();
    window.addEventListener("resize", function() {
        layoutRoot.updateRect();
        layoutRoot.layout();
    });
}
