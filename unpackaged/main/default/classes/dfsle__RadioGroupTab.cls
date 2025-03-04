/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class RadioGroupTab extends dfsle.Tab {
    global dfsle.Tab.Collaboration collaboration {
        get;
    }
    global List<dfsle.RadioGroupTab.Radio> radios {
        get;
    }
    global RadioGroupTab() {

    }
    global dfsle.RadioGroupTab withCollaboration(dfsle.Tab.Collaboration collaboration) {
        return null;
    }
    global dfsle.RadioGroupTab withRadios(List<dfsle.RadioGroupTab.Radio> radios) {
        return null;
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
global class Radio {
    global dfsle.Tab.Anchor anchor {
        get;
    }
    global dfsle.Tab.Formatting formatting {
        get;
    }
    global Integer order {
        get;
    }
    global dfsle.RadioGroupTab.Position position {
        get;
    }
    global Boolean readOnly {
        get;
    }
    global Boolean required {
        get;
    }
    global Boolean selected {
        get;
    }
    global Object value {
        get;
    }
    global Radio(Integer order, dfsle.RadioGroupTab.Position position, dfsle.Tab.Formatting formatting, dfsle.Tab.Anchor anchor, Object value, Boolean selected, Boolean readOnly, Boolean required) {

    }
}
}
