/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class SmartSectionTab extends dfsle.Tab {
    global dfsle.SmartSectionTab.Display display {
        get;
    }
    global dfsle.SmartSectionTab.Anchors smartAnchors {
        get;
    }
    global SmartSectionTab() {

    }
    global dfsle.SmartSectionTab withDisplay(dfsle.SmartSectionTab.Display display) {
        return null;
    }
    global dfsle.SmartSectionTab withSmartAnchors(dfsle.SmartSectionTab.Anchors smartAnchors) {
        return null;
    }
global class Anchor {
    global dfsle.SmartSectionTab.Position position {
        get;
    }
    global Boolean remove {
        get;
    }
    global String text {
        get;
    }
    global Anchor(dfsle.SmartSectionTab.Position position, String text, Boolean remove) {

    }
}
global class Anchors {
    global Boolean caseSensitive {
        get;
    }
    global dfsle.SmartSectionTab.Anchor endAnchor {
        get;
    }
    global dfsle.SmartSectionTab.Anchor startAnchor {
        get;
    }
    global Anchors(dfsle.SmartSectionTab.Anchor startAnchor, dfsle.SmartSectionTab.Anchor endAnchor, Boolean caseSensitive) {

    }
}
global class Collapsible {
    global String arrowClosed {
        get;
    }
    global String arrowColor {
        get;
    }
    global String arrowLocation {
        get;
    }
    global String arrowOpen {
        get;
    }
    global String arrowSize {
        get;
    }
    global String arrowStyle {
        get;
    }
    global String containerStyle {
        get;
    }
    global String labelStyle {
        get;
    }
    global Boolean onlyArrowIsClickable {
        get;
    }
    global String outerLabelAndArrowStyle {
        get;
    }
    global Collapsible(String containerStyle, String labelStyle, String outerLabelAndArrowStyle, String arrowStyle, String arrowClosed, String arrowOpen, String arrowLocation, String arrowColor, String arrowSize, Boolean onlyArrowIsClickable) {

    }
}
global class Display {
    global String cellStyle {
        get;
    }
    global dfsle.SmartSectionTab.Collapsible collapsible {
        get;
    }
    global String display {
        get;
    }
    global Boolean hideLabelWhenOpened {
        get;
    }
    global String inlineOuterStyle {
        get;
    }
    global String label {
        get;
    }
    global String labelWhenOpened {
        get;
    }
    global Integer order {
        get;
    }
    global Integer pageNumber {
        get;
    }
    global String preLabel {
        get;
    }
    global Boolean scrollToTopWhenOpened {
        get;
    }
    global String tableStyle {
        get;
    }
    global Display(String label, String display, Integer pageNumber, Integer order, String tableStyle, String cellStyle, String inlineOuterStyle, Boolean hideLabelWhenOpened, Boolean scrollToTopWhenOpened, String labelWhenOpened, String preLabel, dfsle.SmartSectionTab.Collapsible collapsible) {

    }
}
global class Position {
    global Integer pageNumber {
        get;
    }
    global Integer x {
        get;
    }
    global Integer y {
        get;
    }
    global Position(Integer pageNumber, Integer x, Integer y) {

    }
}
}
