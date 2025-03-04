/*
This file is generated and isn't the actual source code for this
managed global class.
This read-only file shows the class's global constructors,
methods, variables, and properties.
To enable code to compile, all methods return null.
*/
global class ListTab extends dfsle.ReadWriteTab {
    global List<dfsle.ListTab.Item> items {
        get;
    }
    global ListTab() {

    }
    global dfsle.ListTab withItems(List<dfsle.ListTab.Item> items) {
        return null;
    }
global class Item {
    global String label {
        get;
    }
    global Boolean selected {
        get;
    }
    global Object value {
        get;
    }
    global Item(String label, Object value, Boolean selected) {

    }
}
}
